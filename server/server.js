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
		
		// Referencia al socket conectado
		Arduinode.io = io;		
		app.sCliente = sCliente;

		// Crea socket que recibe eventos de los disp. Arduino
		Arduinode.listenSwitchEvents( serverConf );

		sCliente.on('updateDB', ( dispositivos ) => {
			DataStore.saveModel('dispositivos', dispositivos, 'ip', ( err ) => {
				Arduinode.dispositivos.load( serverConf ).getActivos();
				sCliente.emit('DBupdated', (err) ? false : true);
			});
		});

		// ------------ OK
		sCliente.on('getDispositivos', () => {
			var response = () => sCliente.emit('dispositivos', Arduinode.dispositivos.lista);
			response();
			Arduinode.dispositivos.getActivos( response() );
		});

		// Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('switchSalida',( params ) => {
			var onAccion = ( response ) => {
				params.estado = response;
				io.sockets.emit('switchBroadcast', params);
			};

			Arduinode.dispositivos.switch( params, onAccion);
		});

		// Devuelve lista de salidas de un dispositivo (con sus estados)
		sCliente.on('getSalidas',( params, p) => {
			var	onData = ( salidas ) => { sCliente.emit( 'salidas', salidas); };
			Arduinode.dispositivos.getSalidas( onData, params);
		});

		// Devuelve lista de luces encendidas
		sCliente.on('getSalidasActivas', ( params, p) => {
			var	onData = function( luces ) {
				sCliente.emit( 'salidasActivas', luces);
			};

			Arduinode.dispositivos.getSalidasActivas( onData, params);
		});

		// Envia la hora del servidor en cada request Socket.IO
		sCliente.on('*', () => sCliente.emit('horaServidor', new Date().getTime()));
	});

	// Carga lista de dispositivos en memoria
	Arduinode.dispositivos.load( serverConf ).getActivos();

	var timeInterval = serverConf.tiempoActualizacionDispositivos || 60000;
	
	console.log("Actualizando dispositivos cada ",(timeInterval / 1000) / 60, "minutos" )
	
	// Comienza el intervalo de actualizacion de dispositivos
	setInterval(() => { Arduinode.dispositivos.getActivos(); }, timeInterval);
	taskManager.setConfig( serverConf );

	// Carga de tareas programadas
	setTimeout(() => {

		// (watchChanges) Servicio que vigila la ejecución de tareas en caso de falla
		taskManager.loadScheduler(true).watchChanges();

	}, serverConf.tiempoEsperaEscaneoTareas || 0);
});
