/**
 * Módulo con clase Principal de la aplicación
 * Interactua con Dispositivo y Socket, a través de una clase Facade (Arduinode)
 * @module Arduinode
 */

var clases 		= require('./Main.js'),
	socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
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

				socket.on('data', function( data ) {
					This.ip = socket.remoteAddress;
					This.data+= data.toString().replace("\r","+");
				});

				socket.on('end', function() {
					
					This.data = This.data.replace("\n","-").replace("+n"," ").slice(0, -1);
					var salidas_raw = This.data.slice(0,-1).split("+-");
					
					var salidas = [];
					salidas_raw.forEach( function(v) {
						salidas.push({ 
							nro_salida: parseInt( v.slice(1,-1) ), 
							estado: parseInt( v.slice(-1)), 
							temporizada: null,
							ip: This.ip
						});
					});
					salidas.forEach( function(v) {
						This.io.sockets.emit('switchBroadcast', v);
					});
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
		salidasEncendidas: [],
		getActivos: function() {
			console.log("Refrescando lista de dispositivos activos")
			var i = 0;
			var This = this;

			var loop = function(i) {
				var disp = This.lista[i];

				if (disp ) {
					var version = null;
					This.lista[i].offline = true;
					This.lista[ i ].version = version;

					var onResponse = function( data, ip ) {
						if ( data) {
							var dataParsed = data.split("\n")[0];
							var posV = dataParsed.indexOf('Version:');
							version = dataParsed.trim().slice( posV + 9 );
							This.lista[ i ].offline = false;
							This.lista[ i ].version = version;
						}
						
						if ( i <= This.lista.length ) {
							if (This.sCliente !== null) {
								This.sCliente.emit('stateDispositivo', 
											 { dispositivo: This.lista[ i ] });
							}
							i++;							
							loop(i);							
						}
					};

					//Consulta la version
					socket.send({ ip: disp.ip, comando: 'I'}, onResponse);
				}
			};
			loop(0);
		},
/**
* Devuelve dispositivo filtrado por IP
* @method getByIP
* @param ip IP del dispositivo a buscar
* @return Dispositivo
*/
		getByIP: function(ip) {
			return _.findWhere(this.lista,{ip: ip});
		},
/**
* Ejecuta un comando sobre una salida de un Dispositivo
* @method accionar
* @param params Objeto JSON con las claves: IP del dispositivo, numero de salida, accion y temporización
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @return Boolean
*/
		switch: function( params, callback ) {
			var This = this;
			this.getByIP( params.ip ).switchSalida( params, function(response) {
				console.log("response",response)
				callback( response );
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
* Devuelve listado de salidas de un Dispositivo, filtradas por estado = 0 (Encendidas)
* @method getSalidasEncendidas
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @return Array
*/
		getSalidasActivas: function( callback ) {
			var This = this;

			var salidasAux 	= [], 
				sockets 	= [], 
				processed	= [];
			
			this.lista.forEach(function(item, key, array) {
				item.buffer = "";
				var salidas,
					connectedSuccess = false,
					encendidas = [],
					params = {
						noError: true,
						ip: item.ip,
						id_disp: item.id_disp
					};

				sockets[key] = new net.Socket();
				sockets[key].setTimeout( serverConfig.socketTimeout );
				
				sockets[key].connect(8000, item.ip, function(response) {
					connectedSuccess = true;
					sockets[key].write('G');
				});

				sockets[key].on('timeout',function(_err) {
					if (processed.indexOf(item.ip) < 0) {
						processed.push(item.ip);
					}
				});

				sockets[key].on('data',function(_data) {
					item.buffer+= _data;
				});

				sockets[key].on('error',function(_err) {
					connectedSuccess = false;
					if (processed.indexOf(item.ip) < 0) {
						processed.push(item.ip);
					}
				});
				sockets[key].on('end',function() {
					var salidas = item.parseSalida(item, item.buffer);
					
					if (salidas.length > 0 && connectedSuccess) {
						salidas.forEach(function(s) {
							if ( s.estado == ON ) callback( s );								
						})
						
						item.buffer = "";
					}
				});
			});
		},
/**
* Registra dispositivos cargados en el modelo (dispositivos.json), en DataStore.dispositivos
* y en atributo lista de esta clase
* @method load
*/
		load: function() {
			var This = this;
			this.lista = [];
			DataStore.getFile('dispositivos').forEach(function(d) {
				var disp = new Dispositivo( d.id_disp, d.ip, d.note );
				disp.setSalidas( d.salidas );
				This.lista.push(disp);
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