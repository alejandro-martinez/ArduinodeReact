//Dependencias
var	express 	= require('express'),
	app 		= express(),
	fs			= require('fs'),
	compress 	= require('compression'),
	http 		= require('http').Server(app),
	taskManager	= require('./TaskManager'),
	expressConfig = require('./config/config').config(app, express),
	Arduinode	= require('./Arduinode').Arduinode;
	middleware 	= require('socketio-wildcard')(),
	io 			= require('socket.io')(http);
	require('./controllers')(app);
	app.use(compress());

var serverConfig = {},
	serverInfo	 = { host: "localhost", port:8888 },
	configPath 	 = './config/config.json';

/* Crea o busca el archivo de configuracion para el servidor
y Programador de tareas */

if ( !fs.existsSync( configPath )) {
	var config = '{"ip":"localhost","port":8888, "tiempoEscaneoTareas":300000, "socketTimeout":500}';
	fs.writeFileSync(configPath, config);
}

var serverConfig = require(configPath);

// Server HTTP
http.listen(serverConfig.port, serverConfig.ip, function() {
	console.log("Server iniciado en: ", serverConfig.ip + 
								  ":" + serverConfig.port);

	// Captura excepciones para no detener el servidor
	process.on('uncaughtException', function (err) {
		console.log("Ocurrió un error:", err);
	});

	/* Registra middleware para capturar requests de SocketIO
	y enviar la hora del servidor */
	io.use(middleware);

	var refreshSalidasEncendidas = function() {
		Arduinode.dispositivos.salidasEncendidas = [];
		Arduinode.dispositivos.getSalidasEncendidas();
	};

	// Conexión de un cliente
	io.on('connection', function( sCliente ) {
		Arduinode.io = io;

		// Referencia al socket conectado
		app.sCliente = Arduinode.dispositivos.sCliente = sCliente;

		// Crea socket que recibe eventos de los disp. Arduino
		Arduinode.listenSwitchEvents( serverConfig );

		//Devuelve todos los dispositivos
		sCliente.on('getDispositivos', function() {			
			var dispositivos = Arduinode.dispositivos.lista;
			Arduinode.dispositivos.getActivos();
			sCliente.emit('numDispositivos',{ num: dispositivos.length });
			sCliente.emit('dispositivos', dispositivos);
		});

		// Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('accionarSalida', function( params ) {

			var onAccion = function(response) {
				refreshSalidasEncendidas();
				sCliente.emit('accionarResponse', response);
				sCliente.broadcast.emit('switchBroadcast', params);
			};

			Arduinode.dispositivos.accionar(params, onAccion);
		});

		// Devuelve lista de salidas de un dispositivo (con sus estados)
		sCliente.on('getSalidas', function( params, p) {
			var	onData = function( salidas ) {
				sCliente.emit( 'salidas', salidas);
			};

			Arduinode.dispositivos.getSalidas( onData, params);
		});

		// Devuelve lista de luces encendidas
		sCliente.on('getLucesEncendidas', function( params, p) {

			var	onData = function( luces ) {
				sCliente.emit( 'lucesEncendidas', luces);
			};

			Arduinode.dispositivos.getLucesEncendidas( onData, params);
		});

		// Envia la hora del servidor en cada request Socket.IO
		sCliente.on('*', function() {
			sCliente.emit('horaServidor', new Date().getTime());
		});

	});

	// Carga lista de dispositivos en memoria
	Arduinode.dispositivos.load( serverConfig ).getActivos();
	var timeInterval = serverConfig.tiempoActualizacionDispositivos || 60000;
	
	console.log("Actualizando dispositivos cada ",(timeInterval / 1000) / 60, "minutos" )
	
	// Comienza el intervalo de actualizacion de dispositivos
	setInterval(function() { Arduinode.dispositivos.getActivos(); }, timeInterval);
	taskManager.setConfig( serverConfig );

	// Carga de tareas programadas
	setTimeout(function() {

		// (watchChanges) Servicio que vigila la ejecución de tareas en caso de falla
		taskManager.loadScheduler(true).watchChanges();

	}, serverConfig.tiempoEsperaEscaneoTareas || 0);
});
