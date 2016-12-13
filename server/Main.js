"use strict";

//Dependencias
var socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	DataStore	= require('./DataStore').DataStore,
	Promise 	= require('promise'),
	fs			= require('fs'),
	events 		= require("events"),
	log			= require('./utils/Log');
	_ 			= require('underscore');
var Arduinode = require('./Arduinode');

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
							response = parseInt( response.replace(/(?:\r\n|\r|\n)/g, ''));
							salida.estado = response;
							salida.temporizada = params.temporizada;
							Arduinode.broadcastDB();

							callback( response);
						});
					}
					else {
						log(salida.descripcion + " ya tiene el estado: " + estadoDeseado.trim());
						callback();
					}
				}
				else {
					log("No se pudo conectar con: " + params.ip);
					callback();
				}
			});
		}
	}
	parseSalida(params, _data ) {
		const This = this;
		if (_data && _data.length > 0) {

			var newSalidas = false;
			var parsed = [];
			
			_data.forEach(function(str) {
				if (str && str.length) {
					var posGuion 	= str.indexOf("-"),
						posDospuntos= str.indexOf(":"),
						posPunto 	= str.indexOf("."),
						nro 	= str[posGuion+1] + str[posGuion+2];
					
					var temporizada = 0;

					if (posPunto > -1) {
						temporizada = DateConvert.min_a_horario(str.substr( posPunto + 1));
					}
					// Si la salida existe en el JSON
					var salidaFound = This.getSalidaByNro(nro );

					if (salidaFound) {
						var salida = JSON.parse(JSON.stringify(salidaFound));
						salida.estado = parseInt( str[posDospuntos+1] );
						salida.temporizada = (temporizada === null) ? 0 : temporizada;
					}
					else {
						newSalidas = true;
						var dispositivos = Arduinode.dispositivos;
						var dispositivo = _.findWhere(dispositivos,{ ip: params.ip });
						
						dispositivo.salidas.push({
							nro	 : parseInt( nro ),
							tipo : str[0],
							descripcion : "Salida " + nro
						});

						var salida = {
							nro			: parseInt(nro),
							tipo		: str[0],
							descripcion	: "Salida " + nro,
							ip			: params.ip,
							estado		: parseInt( str[posDospuntos+1] ),
							temporizada	: temporizada
						};
					}
					parsed.push(salida);
				}
			});

			//Actualiza el JSON si se encontraron salidas nuevas
			if ( newSalidas ) {
				Arduinode.updateDispositivos();
			}
			return parsed;
		}
	}
	getSalidasByEstado( _estado, _array ) {
		var salidas = _.where(_array, {estado: _estado});
	}
	getSalidas( callback ) {
		var params = { comando: 'G', ip: this.ip };
		
		//Asumo que el dispositivo no está disponible, sino, piso la versión
		this.version = "V.XXX";
		this.offline = true;

		socket.send( params, ( response ) => {
			if ( response ) {
				response = response.split("\n");
				var tieneVersion = (response[0].slice(0,1).trim() === "V");
				this.version = response[0];				
				if (tieneVersion) response.shift();
				this.offline = false;
				callback( this.parseSalida( params, response ));
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
				var salida = SalidaFactory.create( s.nro, s.tipo, s.descripcion, this.ip );

				// Actualiza estado si viene en el array
				if ( s.temporizada && salida.temporizada !== null ) {
					salida.temporizada = s.temporizada;
				}
				salida.estado = s.estado;
				salida.ip = this.ip;
				this.salidas.push( salida);
			});
		}

		this.salidas = _.uniq(this.salidas, function (item, key, a) {
            return item.ip && item.nro;
        });
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
	constructor ( nro, _descripcion, _ip ) {
		super(nro, _descripcion);
		this.ip 	 = _ip;
		this.tipo 	 = 'L';
		this.comando = 'T';
	}
	switch( params, callback ) {
		var comando = this.comando
								+ this.nro
								+ params.estado
								+ "."
								+ DateConvert.horario_a_min(params.temporizada);

		super.switch({ comando: comando, ip: this.ip}, callback);
	}
}

class Persiana extends Salida {
	constructor( nro, _descripcion ) {
		super( nro, _descripcion );
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
		
		switch (_tipo) {
			case "P":
				return new Persiana(nro, _descripcion, _ip);
				break;
			case "S":
				return new Sensor(nro, _descripcion, _ip);
				break;
			default:
				return new Luz(nro, _descripcion, _ip);
		}
	}
}
exports.Dispositivo = Dispositivo;