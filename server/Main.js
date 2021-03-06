"use strict";

//Dependencias
var socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	DataStore	= require('./DataStore').DataStore,
	fs			= require('fs'),
	events 		= require("events"),
	log			= require('./utils/Log');
	_ 			= require('underscore');
var Arduinode 	= require('./Arduinode');

/**
* Representa un Dispositivo Arduino. Permite:
* 1) accionar las salidas que posee, (Luces, Bombas, Persianas);
* 2) Consultar lista de salidas y sus estados
*
* @class Dispositivo
* @constructor
*/
/**
* Dirección IP del dispositivo
* @property ip
* @type String
*/
/**
* Descripción del dispositivo
* @property descripcion
* @type String
*/
/**
* Lista de salidas (instancias de Salida) del dispositivo
* @property salidas
* @type Array
*/
class Dispositivo {
	constructor(_id, _ip, _descripcion) {
		this.id_disp 	 = _id 	 || null;
		this.ip 	 	 = _ip 	 || null;
		this.descripcion = _descripcion || null;
		this.salidas = [];
	}
	getSalidaByNro( nro ) {
		var salida = _.findWhere(this.salidas, { nro: parseInt(nro) });
		return salida;
	}
/**
* Accion sobre una salida de un dispositivo. Antes de accionar se consulta el estado de 
* la salida. Si es distinto al estado deseado, se envia la orden y se hace broadcast
* a los clientes conectados
* @param params 
* @method switchSalida
*/
	switchSalida(params, callback) {
		
		var salida = this.getSalidaByNro( params.nro );

		if ( salida ) {
			var params_aux = params;

			//Consulta estado de la salida, antes de enviar comando			
			salida.getEstado( params_aux,( estadoActual ) => {

				if (typeof estadoActual != 'undefined') {

					//Si la salida tiene distinto estado al que se quiere llevar
					var estadoDeseado = String( params.estado ).concat( ".", params.temporizada || 0 );

					if ( estadoActual.trim() !=  estadoDeseado.trim() ) {
						salida.switch( params , ( response ) => {
							if (response) {
								response = parseInt( response.replace(/(?:\r\n|\r|\n)/g, ''));
								salida.estado = response;
								salida.temporizada = params.temporizada;
								log(3, "--- Se " + ((response) ? "apaga" : "enciende") + " " + salida.descripcion + " - " + params_aux.ip);
							}
							callback( response);
						});
					}
					else {
						salida.estado = parseInt( estadoActual.substr(0,1) );
						salida.temporizada = parseInt( estadoActual.slice(2) );
						log(1, salida.descripcion + " ya tiene el estado: " + estadoDeseado.trim());
						callback( -1 );
					}
				}
				else {
					this.offline = true;
					log(2, "No se pudo conectar con: " + params.ip);
					callback();
				}
			});
		}
	}
	updateEstadoSalida( params ) {
		// Si la salida existe en el JSON
		var salida = this.getSalidaByNro( params.nro );
		if ( salida ) {
			salida.estado = params.estado;
			salida.temporizada = params.temporizada || 0;
		}
		else {
			salida = this.addNewSalida( params );
		}
		return salida;
	}
	addNewSalida( params ) {
		this.salidas.push({
			nro	 : params.nro,
			tipo : params.tipo,
			descripcion : "Salida " + params.nro
		});

		var salida = {
			nro			: params.nro,
			tipo		: params.tipo,
			descripcion	: "Salida " + params.nro,
			ip			: params.ip,
			estado		: params.estado,
			temporizada	: params.temporizada
		};

		return salida;
	}
	parseSalidas(params, _data ) {
		
		if (_data && _data.length > 0) {

			var salidaExiste = false,
				newSalidas = false,
				parsed = [];
			
			_data.forEach((str) => {
				
				if (str !== undefined && str.length) {
					var temporizada = 0;

					if (str.indexOf(".") > -1) {
						temporizada = DateConvert.min_a_horario( str.substr( str.indexOf(".") + 1));
					}
					
					params.temporizada = (temporizada === null) ? 0 : temporizada;
					params.tipo = str[0];
					params.estado = parseInt( str[ str.indexOf(":") + 1] );
					params.nro = parseInt(str[ str.indexOf("-") + 1] 
										+ str[ str.indexOf("-") + 2]);

					salidaExiste = this.getSalidaByNro( params.nro );
					
					if (!salidaExiste && newSalidas === false) {
						
						newSalidas = true;
					}

					parsed.push( this.updateEstadoSalida( params ) );
				}
			});
	
			if (newSalidas) Arduinode.updateDispositivos();
			
			return parsed;
		}
	}
	getSalidas( callback ) {
		var params = { comando: 'G', ip: this.ip };

		//Asume que el dispositivo no está disponible, sino, piso la versión
		this.version = "V.XXX";
		this.offline = true;

		socket.send( params, ( response ) => {
			if ( response ) {
				response = response.split("\n");


				var tieneVersion = (response[0].slice(0,1).trim() === "V");
				
				//Elimina el ultimo element porque es null
				response.pop();

				if (tieneVersion) {
					this.version = response[0];
					response.shift();
				}
				this.offline = false;
				callback( this.parseSalidas( params, response ) );
			}
			else {
				callback();
			}
		});
	}
	setSalidas( salidas ) {
		this.salidas = [];

		if ( salidas && salidas.length > 1) {
			salidas.forEach( (s) => {
				
				if (s ) {
					var salida = SalidaFactory.create( s.nro, s.tipo, s.descripcion, this.ip );

					// Actualiza estado si viene en el array
					if ( s.temporizada && salida.temporizada !== null ) {
						salida.temporizada = s.temporizada;
					}
					salida.estado = s.estado;
					salida.ip = this.ip;
					this.salidas.push( salida);
				}
			});
			if (this.salidas.length) {
				this.salidas = _.uniq(this.salidas, function (item, key, a) {
		            return item.ip && item.nro;
		        });
			}
		}
	}
};

class Salida {
	constructor( _nro, _descripcion, _tipo ) {

		this.nro 			= _nro;
		this.descripcion 	= _descripcion;
		this.tipo 			= _tipo;
		this.estado 		= null;
		this.accion 		= null;
		this.comando 		= null,
		this.temporizada	= 0;
	}
	getEstado( params, callback ) {
		params.comando = "S" + params.nro;
		socket.send( params, ( response, timeout ) => {
			if (typeof response != 'undefined') {
				response = response.replace("\r\n","");
			}
			callback( response );
		});
	}
	switch( params, callback ) {
		if (params.hasOwnProperty('comando')) {
			socket.send( params, function( response, timeout ) {
				callback(response)
			});
		}
	}
}

class Luz extends Salida {
	constructor ( args ) {
		// args[0] = Nro
		// args[1] = Descripcion
		// args[2] = IP
		super(args[0], args[1], 'L');
		this.ip 	 = args[2];
		this.tipo 	 = 'L';
		this.comando = 'T';
	}
	switch( params, callback ) {
		var comando = 'T'
						+ this.nro
						+ params.estado
						+ "."
						+ DateConvert.horario_a_min(params.temporizada);

		super.switch({ comando: comando, ip: this.ip}, callback);
	}
}

class Persiana extends Salida {
	constructor( args) {
		// args[0] = Nro
		// args[1] = Descripcion
		// args[2] = IP
		super(args[0], args[1], 'P');
		this.ip 	 = args[2];
		this.tipo = this.comando = 'P';
	}
	switch( params, callback ) {
		var comando = this.comando
					+ this.nro
					+ params.estado;
		super.switch({ comando: comando, ip: this.ip}, callback);
	}
};

class SalidaFactory {
	static create( nro, _tipo, _descripcion, _ip ) {
		var args = [nro, _descripcion, _ip];
		switch (_tipo) {
			case "P":
				return new Persiana(args);
				break;
			case "S":
				return new Sensor(args);
				break;
			default:
				return new Luz(args);
		}
	}
}
exports.Dispositivo = Dispositivo;