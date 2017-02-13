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
		var updated = [];
		
		salidas_raw.forEach((v) => {
			var params = { nro: parseInt( v.slice(1,-1) ), estado: parseInt( v.slice(-1)) };
			var disp = this.getDispositivoByIP( this.ip );
			var salida = disp.getSalidaByNro( params.nro );

			if (params.estado != salida.estado) {
				updated.push ( disp.updateEstadoSalida( params ) );
			}
		});

		return updated;
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
					
					This.data = This.data.replace("\n","-").replace("+n"," ").slice(0, -1);
					
					var salidasUpdated = This.updateEstadoSalidas( This.data.slice(0,-1).split("+-") );
					
					salidasUpdated.forEach((s) => {
						log(1, This.ip + " - Evento externo: Se " + ((s.estado === 0) ? 'prendió ' : 'apagó ') + s.descripcion);
					});

					This.broadcastDB();
				});
			});
				
			this.socketTCP.listen({ host: conf.ip, port: 8889 }, function() {
				log(1,'Socket escuchando eventos en: '+ conf.ip  + ":" + "8889");
			});
		}
	},
/**
* Hace broadcast de lista de dispositivos con sus salidas y estados
* @method broadcastDB
*/
	broadcastDB: function( db ) {
		if (!pause) {
			var pause = null;
		}
		else {
			clearTimeout( pause );
		}

		if ( this.io.hasOwnProperty('sockets') ) {
			pause = setTimeout(() => {
				this.io.sockets.emit('DBDispositivosUpdated', db || this.dispositivos);
			}, parseInt(serverConfig.broadcastTimeout) * 1000);
		}
	},
	getSalidaByDescripcion: function( descripcion ) { 
		var found = null;

		this.dispositivos.forEach((d,k,_this) => {

			d.salidas.every((s, index) => {
				if ( s.descripcion.toLowerCase() === descripcion ) {
					found = d.salidas[index];
					return false;
				}

				return true;
			});
			if (found) return found;
		});
		return found;
	},
	getDispositivoByIP: function( ip ) { 
		return _.findWhere( this.dispositivos,{ ip: ip }); 
	},
/**
* Actualiza JSON de dispositivos
* @method updateDispositivos
*/	
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
			dispositivo.switchSalida( params, ( response ) => {
				this.broadcastDB();
				callback();
			});
		}
	},
/**
* Registra dispositivos cargados en el modelo (dispositivos.json),
* y los sincroniza con el estado de los dispositivos Arduino reales
* en atributo lista de esta clase
* @method loadDispositivos
*/
	loadDispositivosDB: function() {
		var newDispositivos = false;
		
		this.dispositivos = [];

		this.DataStore.getFile('dispositivos').forEach((d) => {
			var dispositivo = new Dispositivo( d.id_disp, d.ip, d.descripcion );
			if ( d.salidas.length === 0 ) newDispositivos = true;
			dispositivo.setSalidas( d.salidas );			
			this.dispositivos.push( dispositivo );
		});
		
		if (newDispositivos) this.getEstadosDispositivos(() => { this.broadcastDB() });

		return this;
	},
/**
* Consulta los estados de los dispositivos y los guarda en memoria
* @method getEstadosDispositivos
*/
	getEstadosDispositivos( callback ) {
		Arrays.asyncLoop( this.dispositivos, ( disp, report ) => {
			if ( disp ) {
				disp.getSalidas( (estados) => {
					if ( estados ) disp.setSalidas( estados );
					report();
				});
			}
		},() => { 
			callback( this.dispositivos ); 
		});
	}
};
module.exports = Arduinode;