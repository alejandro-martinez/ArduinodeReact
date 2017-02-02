var fs = require('fs');
var serverConf = {}, configPath = './config/config.json';

// Busca o crea el archivo de config

if ( !fs.existsSync( configPath )) {
	var config = '{"ip":"localhost","broadcastTimeout": 3, "port":9999,"claveApp":"9","intervaloEscaneoTareas":5,"retardoCargaTareas":1, "socketTimeout":500, "msjsLog": {"tareas": true,"dispositivos": true,"errores": true,"eventos": true}}';
	fs.writeFileSync( configPath, config );
}

//Dependencias
var	express 	= require('express'),
	app 		= express(),
	compress 	= require('compression'),
	http 		= require('http').Server( app ),
	taskManager	= require('./TaskManager'),
	expressConf = require('./config/config').config( app, express ),
	Arduinode	= require('./Arduinode');
	middleware 	= require('socketio-wildcard')(),
	Arrays 		= require('./utils/Arrays')(),
	io 			= require('socket.io')( http);
	log			= require('./utils/Log');
	DataStore 	= require('./DataStore').DataStore;
				  require('./controllers')( app );	
	app.use( compress() );


var serverConf = require( configPath );
// Server HTTP

http.listen( serverConf.port, serverConf.ip, () => {

	var waitingBroadcast = false;

	log(3, "Server iniciado en: " + serverConf.ip + ":" + serverConf.port);

	// Captura excepciones para no detener el servidor 
	process.on('uncaughtException', (err) => log(2, "Ocurrió un error:" + err));

	// Registra middleware para capturar requests de SocketIO 
	io.use( middleware );

	// Referencia al socket conectado
	Arduinode.io = taskManager.io = io;

	// Crea socket que recibe eventos de los disp. Arduino
	Arduinode.listenSwitchEvents( serverConf );

	// Conexión de un cliente
	io.on('connection', ( sCliente ) => {

		sCliente.emit('configUpdated', serverConf);

		sCliente.emit('DBDispositivosUpdated', Arduinode.dispositivos);

		sCliente.emit('DBZonasUpdated', DataStore.zonas);
		
		sCliente.on('getZonasDB', () => { 
			Arduinode.loadZonasDB( function() {
				sCliente.emit('DBZonasUpdated', DataStore.zonas);
			});
		});

		sCliente.on('getDispositivosDB', () => {
			if ( !waitingBroadcast ) {
				waitingBroadcast = true;
				Arduinode.getEstadosDispositivos( function( dispositivos ) {
					waitingBroadcast = false;
					sCliente.emit('DBDispositivosUpdated', dispositivos);
				});
			}
		});

		sCliente.on('getTareasDB', () => { 
			sCliente.emit('DBTareasUpdated', DataStore.tareas);
		});

		sCliente.on('updateDispositivosDB', ( db ) => { 
			// Actualizacion de archivo JSON, sin tocar los estados de las salidas
			if (DataStore.updateDB('./models/dispositivos', db, false)) {
				
				//Si pido actualizar, actualiza los datos a los clientes conectados
				Arduinode.broadcastDB( db );
			}

			//Recarga de modelos en memoria
			Arduinode.loadDispositivosDB();
		});
		
		sCliente.on('updateConfigDB', ( config ) => { 
			DataStore.updateDB('./config/config',config,false);
			io.sockets.emit('configUpdated', config);
			taskManager.setConfig( config ).watchChanges();
		});

		sCliente.on('updateZonasDB', ( db ) => { 
			if ( DataStore.updateDB('./models/zonas', db) ) {
				DataStore.zonas = db;	
			}			
			io.sockets.emit('DBZonasUpdated', db);
		});

		sCliente.on('updateTareasDB', ( db ) => { 
			if ( DataStore.updateDB('./models/tareas', db) ) {
				DataStore.tareas = db;	
			}			
			taskManager.loadScheduler( true );
			io.sockets.emit('DBTareasUpdated', DataStore.tareas);
		});

		sCliente.on('apagarTodo', (params) => {
			log(3,"Se ejecuta la acción apagar todo");

			var action = function( _salida, cb ) {
				_salida.estado = 1;
				_salida.temporizada = 0;
			}
			Arrays.asyncLoop( Arduinode.dispositivos, ( dispositivo, report ) => {
				Arrays.asyncLoop(dispositivo.salidas, ( salida, _report) => {
					if ( salida.estado == 0 ) {
						salida.estado = 1;
						salida.temporizada = 0;
						Arduinode.switchSalida( salida, function(){
							_report();
						});
					}
					else {
						_report();
					}
				}, () => {
					report();
				});

			},() => {
				Arduinode.broadcastDB();
			});
		});

		// Accion sobre una zona
		sCliente.on('switchZona',( params ) => {
			var failed = false;
			var voiceCommand = (params.hasOwnProperty('orden'));
			var getZona = function() {
				if ( voiceCommand ) {
					log(3, "Se ejecuta la acción: " + params.orden + " " + params.dispositivo);

					var found = DataStore.zonas.filter((z,k, _this) => {
						if (z.descripcion.toLowerCase() == params.dispositivo) {
							return _this[k];
						}
					});
					if (found.length) {
						var zona = found[0];
						zona.estado = (params.orden == 'prender') ? 0 : 1;						
					}
					else {
						log(3, "No se pudo realizar la accion: " + params.orden + " " + params.dispositivo);
						sCliente.emit('failed');
					}

					return zona;
				}	
				return params;
			}
			
			var zona = getZona();
			if (zona ) {

				Arrays.asyncLoop( zona.dispositivos, ( salida, report ) => {

					if (salida) {
						salida.estado = zona.estado;
						salida.temporizada = 0;
						Arduinode.switchSalida( salida, function( response) {
							if (response === undefined && params.hasOwnProperty('orden')) {
								sCliente.emit('failed');
								return false;
							}
							else {
								report();
							}
						});
					}
				},() => {
					Arduinode.broadcastDB();
				});
			}
		});

		// Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('switchSalida',( params ) => {
			log(3, "Se ejecutó la acción: " + params.orden + " " + params.dispositivo);
			var voiceCommand = (params.hasOwnProperty('orden'));
			if ( voiceCommand ) {
				
				var salida = Arduinode.getSalidaByDescripcion( params.salida );
				if ( salida ) {
						delete salida.comando;
						salida.estado = (params.orden == 'prender') ? 0 : 1;
						var params = salida;
				}
				else {
					sCliente.emit('failed');
				}
			}

			Arduinode.switchSalida( params, function(){});
		
		});	

		sCliente.emit('horaServidor', new Date().getTime());

		setInterval( () => {
			if ( new Date().toISOString().slice(17,19) === '00' ) {
				sCliente.emit('horaServidor', new Date().getTime());
			}
		}, 1000);
	});
	
	Arduinode.DataStore = DataStore;

	// Carga lista de dispositivos en memoria
	Arduinode.loadDispositivosDB();
	Arduinode.getEstadosDispositivos(() => { Arduinode.broadcastDB() });

	taskManager.setConfig( serverConf );

	// Carga de tareas programadas
	setTimeout(() => {

		// Servicio que vigila la ejecución de tareas en caso de falla
		taskManager.loadScheduler( true ).watchChanges();

	}, (serverConf.retardoCargaTareas * 1000 * 60) || 1);
});
