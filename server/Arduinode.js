/**
 * Módulo con clase Principal de la aplicación
 * Interactua con Dispositivo y Socket, a través de una clase Facade (Arduinode)
 * @module Arduinode
 */

var clases 		= require('./Main.js'),
	socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	Arrays 		= require('./utils/Arrays')(),
	_ 			= require('underscore'),
	serverConfig= require('./config/config.json'),
	DataStore 	= require('./DataStore').DataStore,
	net 		= require('net');
	Dispositivo = clases.Dispositivo;
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
function Arduinode() {
	this.io = {};
	this.socketTCP = null;
/**
* Registra un socket para escuchar eventos de los dispositivos Arduino reales.
* Emite un broadcast a todos los dispositivos conectados a la aplicacion,
* cuando se produce un evento,
* @method listenSwitchEvents
* @param conf Configuracion para el socket (IP, puerto)
* @return null
*/	
	this.listenSwitchEvents = function( conf ) {
		var This = this;
		if ( !this.socketTCP ) {
			
			this.socketTCP = net.createServer( function( socket ) {
				
				This.data = "";

				socket.on('data', ( data ) => {
					This.ip = socket.remoteAddress;
					This.data+= data.toString().replace("\r","+");
				});

				socket.on('end', function() {
					console.log("Evento externo de: ", This.ip);
					This.data = This.data.replace("\n","-").replace("+n"," ").slice(0, -1);
					var salidas_raw = This.data.slice(0,-1).split("+-");
					
					var salidas = [];
					salidas_raw.forEach( function(v) {
						salidas.push({ 
							nro_salida: parseInt( v.slice(1,-1) ), 
							estado: parseInt( v.slice(-1)), 
							temporizada: 0,
							ip: This.ip
						});
					});
					
					var dispositivo = This.dispositivos.getByIP( This.ip );

					salidas.map((t) => {
						var index = dispositivo.salidas.findIndex((s) => { 
							return s.nro_salida == t.nro_salida;
						});
						dispositivo.salidas[index].estado = t.estado;
					});

					This.io.sockets.emit('DBUpdated', This.dispositivos.lista)
				});
			});
				
			this.socketTCP.listen({ host: conf.ip, port: conf.port + 1 }, function() {
				console.log('Socket escuchando arduinos en:'+ conf.ip, conf.port+1);
			});
		}
	};
	this.dispositivos = {
		lista: [],
		sCliente: null,
/**
* Devuelve dispositivo filtrado por IP
* @method getByIP
* @param ip IP del dispositivo a buscar
* @return Dispositivo
*/
		getByIP: function( ip ) { 
			return _.findWhere( this.lista,{ ip: ip }); 
		},
/**
* Ejecuta un comando sobre una salida de un Dispositivo
* @method switch
* @param params Objeto JSON con las claves: IP del dispositivo, numero de salida, accion y temporización
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @return Boolean
*/
		switch: function( params, callback ) {
			this.getByIP( params.ip )
				.switchSalida(params, function(response) {
					callback( response )
				});
		},

/**
* Devuelve las salidas de un Dispositivo Arduino
* @method getSalidas
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @param params Objeto JSON con la clave IP del dispositivo
* @return Array
*/
		getSalidas: function( callback, params ) {
			var disp = this.getByIP( params.ip );
			if ( disp ) {
				disp.getSalidas(params, callback);
			}
			else {
				callback( [] );
			}
		},
/**
* Registra dispositivos cargados en el modelo (dispositivos.json),
* y los sincroniza con el estado de los dispositivos Arduino reales
* en atributo lista de esta clase
* @method load
*/
		load: function() {
			this.lista = [];

			DataStore.getFile('dispositivos').forEach((d) => {
				var _d = new Dispositivo( d.id_disp, d.ip, d.note );
				_d.setSalidas( d.salidas );
				this.lista.push(_d);
			});

			Arrays.asyncLoop( this.lista, (disp, report) => {
				
				if ( disp ) {
					disp.getSalidas( (estados) => {
						if ( estados ) {
							disp.setSalidas( estados );
						}
						report();
					});
				}
			},() => {
				if (this.io) {
					this.io.sockets.emit('DBUpdated', this.lista);
				}
			});

			return this;
		}
	};
}

Arduinode.instance = null;
Arduinode.getInstance = function() {
    if( this.instance === null ){
        this.instance = new Arduinode();
    }
    return this.instance;
};
exports.Arduinode = Arduinode.getInstance();