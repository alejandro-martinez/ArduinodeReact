//Dependencias
var	express 	= require('express'),
	app 		= express(),
	fs			= require('fs'),
	compress 	= require('compression'),
	http 		= require('http').Server( app ),
	taskManager	= require('./TaskManager'),
	expressConf = require('./config/config').config( app, express ),
	Arduinode	= require('./Arduinode').Arduinode;
	middleware 	= require('socketio-wildcard')(),
	io 			= require('socket.io')( http);
	log			= require('./utils/Log');
	DataStore 	= require('./DataStore').DataStore;
				  require('./controllers')( app );
	app.use( compress() );

var serverConf = {}, configPath = './config/config.json';

// Busca o crea el archivo de config

if ( !fs.existsSync( configPath )) {
	var config = '{"ip":"localhost","port":9999, "tiempoEscaneoTareas":300000, "socketTimeout":500}';
	fs.writeFileSync( configPath, config );
}

var serverConf = require( configPath );

// Server HTTP

http.listen( serverConf.port, serverConf.ip, () => {

	log("Server iniciado en: " + serverConf.ip + ":" + serverConf.port);

	// Captura excepciones para no detener el servidor 
	process.on('uncaughtException', (err) => log("Ocurrió un error:" + err));

	// Registra middleware para capturar requests de SocketIO 
	io.use( middleware );

	// Conexión de un cliente
	io.on('connection', ( sCliente ) => {

		sCliente.emit('DBDispositivosUpdated', Arduinode.dispositivos.lista);		
		
		// Referencia al socket conectado
		Arduinode.io = io;
		
		// Crea socket que recibe eventos de los disp. Arduino
		Arduinode.listenSwitchEvents( serverConf );

		sCliente.on('getDispositivosDB', () => { 
			Arduinode.dispositivos.load( function() {
				sCliente.emit('DBDispositivosUpdated', Arduinode.dispositivos.lista);
			})
		});

		sCliente.on('getTareasDB', () => { 
			sCliente.emit('DBTareasUpdated', DataStore.tareas);
		});

		sCliente.on('updateDispositivosDB', ( db ) => { 
			if ( Arduinode.dispositivos.update( db )) {
				Arduinode.dispositivos.load();
			}
			io.sockets.emit('DBDispositivosUpdated', db);
		});

		sCliente.on('updateTareasDB', ( db ) => { 
			console.log("tareas",db)
			DataStore.updateDB('tareas', db);
			taskManager.loadScheduler( true );
			io.sockets.emit('DBTareasUpdated', db);
		});

		// Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('switchSalida',( params ) => {
			var onAccion = () => {
				io.sockets.emit('DBDispositivosUpdated', Arduinode.dispositivos.lista);
			};
			Arduinode.dispositivos.switch( params, onAccion);
		});

		// Envia la hora del servidor en cada request Socket.IO
		sCliente.on('*', () => sCliente.emit('horaServidor', new Date().getTime()));
	});

	// Carga lista de dispositivos en memoria
	Arduinode.dispositivos.load();

	taskManager.setConfig( serverConf );

	// Carga de tareas programadas
	setTimeout(() => {

		// Servicio que vigila la ejecución de tareas en caso de falla
		taskManager.loadScheduler( true ).watchChanges();

	}, serverConf.tiempoEsperaEscaneoTareas || 100);
});
