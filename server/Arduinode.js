/**
 * Módulo con clase Principal de la aplicación
 * Interactua con Dispositivo y Socket, a través de una clase Facade (Arduinode)
 * @module Arduinode
 */

var	socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	Arrays 		= require('./utils/Arrays')(),
	_ 			= require('underscore'),
	serverConfig= require('./config/config.json'),
	log			= require('./utils/Log');
	net 		= require('net');
	const 	 ON = 0, 
			OFF = 1;
/**
* Clase principal de la aplicación que simplifica la interaccion con Dispositivos Arduino
* - Interactua con Dispositivo y Socket;
* @class Arduinode
* @constructor
*/

/**
* Instancia de modulo net, para recibir datos de Dispositivos Arduino 
* @property socketTCP
* @type net Object (socket)
*/
/**
* Lista de dispositivos Arduino registrados
* @property dispositivos
* @type JSON Object
*/
Arduinode = {
	io: {},
	DataStore: {},
	socketTCP: null,
	sCliente: null,
	dispositivos: [],
/**
* Al recibir un evento externo (listenSwichEvents)
* toma array de salidas con los estados actuales de un dispositivo,
* y actualiza los estados de las mismas del dispositivo.
@method updateEstadoSalidas
@params salidas_raw Array de salidas
*/
	updateEstadoSalidas: function( salidas_raw ) {
		var salidas = [];
		salidas_raw.forEach((v) => {
			salidas.push({ nro: parseInt( v.slice(1,-1) ), estado: parseInt( v.slice(-1)) });
		});
		salidas.forEach((s) => { this.getDispositivoByIP( this.ip ).updateEstadoSalida(s) });

		this.broadcastDB();
	},
/**
* Registra un socket para escuchar eventos de los dispositivos Arduino reales.
* Emite un broadcast a todos los dispositivos conectados a la aplicacion,
* cuando se produce un evento,
* @method listenSwitchEvents
* @param conf Configuracion para el socket (IP, puerto)
* @return null
*/	
	listenSwitchEvents: function( conf ) {
		var This = this;
		if ( !this.socketTCP ) {
			
			this.socketTCP = net.createServer( function( socket ) {
				
				This.data = "";

				socket.on('data', ( data ) => {
					This.ip = socket.remoteAddress;
					This.data+= data.toString().replace("\r","+");
				});

				socket.on('end', function() {
					log("Evento externo de: " + This.ip);
					This.data = This.data.replace("\n","-").replace("+n"," ").slice(0, -1);
					This.updateEstadoSalidas( This.data.slice(0,-1).split("+-") );
				});
			});
				
			this.socketTCP.listen({ host: conf.ip, port: 8889 }, function() {
				log('Socket escuchando eventos en: '+ conf.ip  + ":" + "8889");
			});
		}
	},
/**
* Hace broadcast de lista de dispositivos con sus salidas y estados
* @method broadcastDB
*/
	broadcastDB: function( db ) {
		if ( this.io.hasOwnProperty('sockets') ) {
			this.io.sockets.emit('DBDispositivosUpdated', db || this.dispositivos);
		}
	},
	getDispositivoByIP: function( ip ) { 
		return _.findWhere( this.dispositivos,{ ip: ip }); 
	},
	updateDispositivos: function() {
		this.DataStore.updateDB('./models/dispositivos', this.dispositivos);
	},
/**
* Ejecuta un comando sobre una salida de un Dispositivo
* @method switch
* @param params Objeto JSON con las claves: IP del dispositivo, numero de salida, accion y temporización
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @return Boolean
*/
	switchSalida: function( params, callback ) {
		var dispositivo = this.getDispositivoByIP( params.ip );
		if (dispositivo) {
			dispositivo.switchSalida(params,(response) => {
				if (callback) {
					callback( response );
				}
			});
		}
	},
/**
* Registra dispositivos cargados en el modelo (dispositivos.json),
* y los sincroniza con el estado de los dispositivos Arduino reales
* en atributo lista de esta clase
* @param callback Opcional
* @param broadcast Boolean Hacer broadcast o no a los clientes conectados
* @method loadDispositivos
*/
	loadDispositivosDB: function() {
		var newDispositivos = false;
		
		this.DataStore.getFile('dispositivos').forEach((d) => {
			var _d = new Dispositivo( d.id_disp, d.ip, d.descripcion );
			_d.setSalidas( d.salidas );
			if (!newDispositivos) newDispositivos = (d.salidas.length === 0);
			this.dispositivos.push(_d);
		});
		
		if (newDispositivos) this.getEstadosDispositivos(true);

		return this;
	},
	getEstadosDispositivos( broadcast, callback ) {
		Arrays.asyncLoop( this.dispositivos, ( disp, report ) => {
			if ( disp ) {
				disp.getSalidas( (estados) => {
					if ( estados ) disp.setSalidas( estados );
					report();
				});
			}
		},() => {
			if ( broadcast ) this.broadcastDB();
			if ( callback ) callback();
		});
	}
};
module.exports = Arduinode;