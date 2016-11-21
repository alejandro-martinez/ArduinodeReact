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
	io 			= require('socket.io')( http) ;
	DataStore 	= require('./DataStore').DataStore;
				  require('./controllers')( app );
	app.use( compress() );

var serverConf = {}, configPath = './config/config.json';

// Busca o crea el archivo de config

if ( !fs.existsSync( configPath )) {
	var config = '{"ip":"localhost","port":8888, "tiempoEscaneoTareas":300000, "socketTimeout":500}';
	fs.writeFileSync( configPath, config );
}

var serverConf = require( configPath );

// Server HTTP

http.listen( serverConf.port, serverConf.ip, function() {
	console.log("Server iniciado en: ", serverConf.ip + ":" + serverConf.port);

	// Captura excepciones para no detener el servidor 
	process.on('uncaughtException', (err) => console.log("Ocurrió un error:", err) );

	// Registra middleware para capturar requests de SocketIO 
	io.use( middleware );

	// Conexión de un cliente
	io.on('connection', ( sCliente ) => {

		sCliente.emit('DBUpdated', Arduinode.dispositivos.lista);		
		
		// Referencia al socket conectado
		Arduinode.io = io;
		app.sCliente = sCliente;

		// Crea socket que recibe eventos de los disp. Arduino
		Arduinode.listenSwitchEvents( serverConf );

		sCliente.on('getDB', () => { Arduinode.dispositivos.load( serverConf )});

		sCliente.on('updateDB', ( db ) => { 
			if ( Arduinode.dispositivos.update( db )) {
				Arduinode.dispositivos.load( serverConf );
			}
			io.sockets.emit('DBUpdated', db);
		});

		// Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('switchSalida',( params ) => {
			var onAccion = () => {
				io.sockets.emit('DBUpdated', Arduinode.dispositivos.lista);
			};
			Arduinode.dispositivos.switch( params, onAccion);
		});

		// Envia la hora del servidor en cada request Socket.IO
		sCliente.on('*', () => sCliente.emit('horaServidor', new Date().getTime()));
	});

	// Carga lista de dispositivos en memoria
	Arduinode.dispositivos.load( serverConf );
/*
	var timeInterval = serverConf.tiempoActualizacionDispositivos || 60000;
	
	//console.log("Actualizando dispositivos cada ",(timeInterval / 1000) / 60, "minutos" )
	
	// Comienza el intervalo de actualizacion de dispositivos
	taskManager.setConfig( serverConf );

	// Carga de tareas programadas
	setTimeout(() => {

		// (watchChanges) Servicio que vigila la ejecución de tareas en caso de falla
		taskManager.loadScheduler(true).watchChanges();

	}, serverConf.tiempoEsperaEscaneoTareas || 0);*/
});
