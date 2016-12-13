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
* Clase (Singleton, Facade) principal de la aplicación
* - Interactua con Dispositivo y Socket;
* - Mantiene un listado de dispositivos activos
*
* @class Arduinode
* @constructor
*/

/**
* Instancia de modulo net, para recibir datos de Dispositivos Arduino reales
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
* Recibe un array de salidas con los estados actuales de un dispositivo,
* y actualiza las salidas del dispositivo en memoria
*/
	updateEstadoSalidas: function( salidas_raw ) {
		var This = this;
		var salidas = [];
		salidas_raw.forEach( function(v) {
			salidas.push({ 
				nro: parseInt( v.slice(1,-1) ), 
				estado: parseInt( v.slice(-1)), 
				temporizada: 0,
				ip: This.ip
			});
		});
		var dispositivo = this.getDispositivoByIP( This.ip );
		
		salidas.map((t) => {
			var index = dispositivo.salidas.findIndex((s) => { 
				return s.nro == t.nro;
			});
			dispositivo.salidas[index].estado = t.estado;
		});
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
	broadcastDB: function() {
		if ( this.io.hasOwnProperty('sockets') ) {
			this.io.sockets.emit('DBDispositivosUpdated', this.dispositivos);
		}
	},
	getDispositivoByIP: function( ip ) { 
		return _.findWhere( this.dispositivos,{ ip: ip }); 
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
	removeMemKeys: ( remove, arr ) => {
		var keys = ['offline','estado', 'accion','comando','ip','temporizada'];
		var lista = arr || this.dispositivos;
		
		lista.forEach( ( disp ) => {
			disp.salidas.forEach( ( s, k, _this ) => {
				keys.forEach((_k) => {
					if (Object.keys( s ).indexOf(_k) > -1) {
						if ( remove ) {
							delete _this[k][_k];
						}
					}
					else {
						if (!remove) {
							_this[k][_k] = null;
						}
					}
				});
			});
		});
		return lista;
	},
	updateDispositivos: function( dispositivos ) {

		if (!dispositivos) dispositivos = this.dispositivos;

		var dispositivos = this.removeMemKeys( true, dispositivos );
		
		if ( this.DataStore.updateDB('dispositivos', dispositivos) ) {
			this.dispositivos = [];
			this.DataStore.reloadDispositivos(( disp )=> {
				this.dispositivos.push( disp);
			});
			this.broadcastDB();
			return true;
		}
		return false;
	},
/**
* Registra dispositivos cargados en el modelo (dispositivos.json),
* y los sincroniza con el estado de los dispositivos Arduino reales
* en atributo lista de esta clase
* @method load
*/
	loadDispositivos: function( callback, broadcast ) {
		this.DataStore.reloadDispositivos(( disp )=> {
			this.dispositivos.push( disp);
		});
		Arrays.asyncLoop( this.dispositivos, ( disp, report ) => {
			
			if ( disp ) {
				disp.getSalidas( (estados) => {
					if ( estados ) disp.setSalidas( estados );
					report();
				});
			}
		},() => {
			
			this.removeMemKeys( false, this.dispositivos );

			if (callback) callback();
			if ( broadcast ) this.broadcastDB();
		});
		
		return this;
	}
};
module.exports = Arduinode;