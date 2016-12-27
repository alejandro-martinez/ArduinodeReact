var fs = require('fs');
var serverConf = {}, configPath = './config/config.json';

// Busca o crea el archivo de config

if ( !fs.existsSync( configPath )) {
	var config = '{"ip":"localhost","port":9999,"claveApp":"9","tiempoEscaneoTareas":300000, "socketTimeout":500}';
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

	log("Server iniciado en: " + serverConf.ip + ":" + serverConf.port);

	// Captura excepciones para no detener el servidor 
	//process.on('uncaughtException', (err) => log("Ocurrió un error:" + err));

	// Registra middleware para capturar requests de SocketIO 
	io.use( middleware );

	// Conexión de un cliente
	io.on('connection', ( sCliente ) => {

		sCliente.emit('configUpdated', serverConf);

		sCliente.emit('DBDispositivosUpdated', Arduinode.dispositivos);

		sCliente.emit('DBZonasUpdated', DataStore.zonas);
		
		// Referencia al socket conectado
		Arduinode.io = taskManager.io = io;

		// Crea socket que recibe eventos de los disp. Arduino
		Arduinode.listenSwitchEvents( serverConf );

		sCliente.on('getZonasDB', () => { 
			Arduinode.loadZonasDB( function() {
				sCliente.emit('DBZonasUpdated', DataStore.zonas);
			});
		});

		sCliente.on('getDispositivosDB', () => { 
			Arduinode.getEstadosDispositivos( false, function() {
				sCliente.emit('DBDispositivosUpdated', Arduinode.dispositivos);
			});
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
		});

		sCliente.on('updateZonasDB', ( db ) => { 
			DataStore.updateDB('./models/zonas', db);
			io.sockets.emit('DBZonasUpdated', db);
		});

		sCliente.on('updateTareasDB', ( db ) => { 
			DataStore.updateDB('./models/tareas', db);
			taskManager.loadScheduler( true );
			io.sockets.emit('DBTareasUpdated', db);
		});

		sCliente.on('apagarLucesEncendidas', (params) => {
			var action = function( _salida, cb ) {
				_salida.estado = 1;
				_salida.temporizada = 0;
				Arduinode.switchSalida( _salida, function(){
					cb();
				});	
			}
			Arrays.asyncLoop( Arduinode.dispositivos, ( dispositivo, report ) => {
				Arrays.asyncLoop(dispositivo.salidas, ( salida, _report) => {
					
					if (!params.temporizadas) {

						if (salida.temporizada === 0) {

							salida.estado = 1;
							salida.temporizada = 0;
							action( salida, _report);
						}
						else {
							_report();
						}						
					}
					else {
						salida.estado = 1;
						salida.temporizada = 0;
						action( salida, _report);
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
			
			var getZona = function() {
				if (params.hasOwnProperty('voiceMsg')) {
					var found = DataStore.zonas.filter((z,k, _this) => {
						if (z.descripcion.toLowerCase() == params.dispositivo) {
							return _this[k];
						}
					});
					var zona = found[0];
					zona.estado = (params.orden == 'prender') ? 0 : 1;

					return zona;
				}	
				return params;
			}
			
			var zona = getZona();

			Arrays.asyncLoop( zona.dispositivos, ( salida, report ) => {
				salida.estado = zona.estado;
				salida.temporizada = 0;
				Arduinode.switchSalida( salida, function(){
					report();
				});	
			},() => {
				Arduinode.broadcastDB();
			});
		});

		// Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('switchSalida',( params ) => {
			
			if (params.hasOwnProperty('voiceMsg')) {
				
				var dispositivo = Arduinode.getDispositivoByDescripcion(params.dispositivo);
				
				if ( dispositivo ) {

					var salida = dispositivo.salidas.filter((s) => {
						return s.descripcion.toLowerCase() == params.salida;
					});

					if (salida.length) {
						var salida = salida[0];
						delete salida.comando;
						salida.estado = (params.orden == 'prender') ? 0 : 1;
						var params = salida;
						
					}
				}
			}
			Arduinode.switchSalida( params, function(){});
		
		});	
		sCliente.emit('horaServidor', new Date().getTime());

		setInterval( () => {
			if ( new Date().toISOString().slice(17,19) === '00' ) {
				sCliente.emit('horaServidor', new Date().getTime());
			}
		}, 900);
	});
	
	Arduinode.DataStore = DataStore;

	// Carga lista de dispositivos en memoria
	Arduinode.loadDispositivosDB();
	Arduinode.getEstadosDispositivos(true);

	taskManager.setConfig( serverConf );

	// Carga de tareas programadas
	setTimeout(() => {

		// Servicio que vigila la ejecución de tareas en caso de falla
		taskManager.loadScheduler( true ).watchChanges();

	}, serverConf.tiempoEsperaEscaneoTareas || 100);
});
