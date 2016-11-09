/**
 * Modulo con clases Dispositivo y Salida
 * @module Main
 */

//Dependencias
var socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	DataStore	= require('./DataStore').DataStore,
	Arduinode	= require('./Arduinode'),
	fs			= require('fs'),
	events 		= require("events"),
	_ 			= require('underscore');

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
* @property note
* @type String
*/
/**
* Lista de salidas (instancias de Salida) del dispositivo
* @property salidas
* @type Array
*/
function Dispositivo(_id, _ip, _note) {
	this.id_disp = _id 	 || null;
	this.ip 	 = _ip 	 || null;
	this.note 	 = _note || null;
	this.salidas = [];
}

Dispositivo.prototype = {
/**
* Devuelve una salida por Numero.
* @method getSalidaByNro
* @return Salida
*/
	getSalidaByNro: function(nro_salida) {
		var salida = _.findWhere(this.salidas, { nro_salida: parseInt(nro_salida) });
		return salida;
	},

/**
* Ejecuta un comando sobre una salida de un dispositivo.
* @method accionarSalida
* @param params Objeto JSON con la clave IP del dispositivo, numero de salida, y comando
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @return Boolean Resultado del comando
*/
	accionarSalida: function(params, callback) {
		var salida = this.getSalidaByNro( params.nro_salida );

		if (salida) {
			var params_aux = params;
			
			//Consulta estado de la salida, antes de enviar comando			
			salida.getEstado(params_aux, function( estadoActual ) {
				
				//Si la salida tiene distinto estado al que se quiere llevar
				var estadoDeseado = String( params.estado ).concat( ".", params.temporizada || 0 );
				
				if ( estadoActual.trim() !=  estadoDeseado.trim() ) {

					salida.switch( params ,function(response){
						callback(response);
					});
				}
				else {
					if (params.hasOwnProperty('salidaNote')) {
						console.log(params.salidaNote  + " ya se encuentra en el estado: ",estadoActual);
					}
				}
			});
		}
	},
/**
* Parsea los datos recibidos desde los dispositivos Arduino
* @method parseSalida
* @param params Objeto JSON con la clave IP del dispositivo, numero de salida, y comando
* @param _data Raw data recibida desde el dispositivo Arduino
* @return Boolean Resultado del comando
*/
	parseSalida: function(params, _data ) {
		This = this;
		if (_data && _data.length > 0) {
			var newSalidas = false;

			var parsed = [],
				salidasParsed = [];

			if (_data.indexOf("\n") < 0) {
				salidasParsed.push(_data);
			}
			else {
				salidasParsed = _data.split("\n");
			}

			salidasParsed.forEach(function(str) {
				if (str && str.length) {
					var posGuion 	= str.indexOf("-"),
						posDospuntos= str.indexOf(":"),
						posPunto 	= str.indexOf("."),
						nro_salida 	= str[posGuion+1] + str[posGuion+2];
					
					var temporizada = 0;

					if (posPunto > -1) {
						temporizada = DateConvert.min_a_horario(str.substr( posPunto + 1));
					}
					// Si la salida existe en el JSON
					var salidaFound = This.getSalidaByNro(nro_salida );

					if (salidaFound) {
						var salida 				 = JSON.parse(JSON.stringify(salidaFound));
						salida.estado 		 = parseInt( str[posDospuntos+1] );
						salida.temporizada = temporizada;
					}
					else {
						newSalidas = true;
						var dispositivos = DataStore.dispositivos;
						var dispositivo = _.findWhere(dispositivos,{ ip: params.ip });

						dispositivo.salidas.push({
							nro_salida		: parseInt( nro_salida ),
							tipo			: str[0],
							note			: "Salida " + nro_salida
						});

						var salida = {
							nro_salida	: parseInt(nro_salida),
							tipo		: str[0],
							note		: "Salida " + nro_salida,
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
				DataStore.updateFile('dispositivos', function(err) {
					Arduinode.Arduinode.dispositivos.load();
				});
			}
			return parsed;
		}
	},
/**
* Devuelve listado de salidas de un Dispositivo filtradas por Estado
* @method getSalidasByEstado
* @param _estado Estado (0 o 1)
* @param _array  Listado de salidas
* @return Array
*/
	getSalidasByEstado: function( _estado, _array ) {
		return _.where(_array, {estado: _estado});
	},
/**
* Devuelve listado de salidas de un Dispositivo filtradas por Ip
* @method getSalidas
* @param params JSON con clave: IP del Dispositivo
* @param callback Funcion callback que se ejecuta cuando se completa la operación
* @return Array
*/
	getSalidas: function( params, callback ) {
		params.comando = 'G';
		var This = this;
		socket.send( params, function( response ) {
			callback( This.parseSalida( params, response ) );
		});
	},
/**
* Almacena listado de salidas en la instancia de un Dispositivo
* @method setSalidas
* @param {JSON Array} _salidas listado de salidas del Dispositivo
*/
	setSalidas: function( _salidas ) {
		var This = this;
		if (_salidas && _salidas.length) {
			_salidas.forEach(function(s) {
				var factory = new SalidaFactory(),
					salida 	= factory.create( s.nro_salida, s.tipo, s.note, This.ip );
				This.salidas.push( salida);
			});
		}
	},
/**
* Carga lista de dispositivos en memoria
* @method load
*/
	load: function() {
		DataStore.getFile('dispositivos');
	}
};

/**
* Representa una Salida de un Dispositivo
*
* @class Salida
* @constructor
*/
/**
* Numero de salida
* @property nro_salida
* @type Integer
*/
/**
* Descripción de la salida
* @property note
* @type String
*/
/**
* Tipo de Salida ( P o L)
* Dispositivo real asociado a la salida (Luz, persiana, Bomba)
* *Bomba se trata como Luz
* @property tipo
* @type String
*/
/**
* (Opcional) Temporizacion en minutos para activar una salida
* Se envia al socket como parte del comando. Solo es valida con salidas Tipo L
* El dispositivo Arduino real, apaga la salida una vez agotado el tiempo de temporizada
* @property temporizada
* @type Integer
*/
/**
* Accion a ejecutar sobre la salida
* Se envia al socket como parte inicial del atributo comando.
* Si la salida es tipo L: accion puede tomar los valores:
* --> S para consultar el estado de la salida
* --> T para encender o apagar la salida
* @property accion
* @type Integer
*/
/**
* Estado actual de la salida (ON / OFF)
* Solo es valida con salidas tipo L
* [0, 1] Donde 0 significa ON (encendida), 1 (OFF)
* @property estado
* @type Integer
*/
/**
* Comando a ejecutar sobre la salida
* Se envia al socket y tiene la siguiente sintaxis:
* ACCION + NUMERO DE SALIDA + ESTADO ( + . TEMPORIZADA)
* Ejemplo: Encender la salida numero 24 	 -> T240
* Ejemplo: Encender la salida durante 1 hora -> T240.60
* @property comando
* @type Integer
*/

function Salida( _nro_salida, _note, _tipo ) {

	this.nro_salida 	= _nro_salida 	|| null;
	this.note 			= _note 		|| null;
	this.tipo 			= _tipo 		|| null;
	this.estado 		= null;
	this.accion 		= null;
	this.comando 		= null,
	this.temporizada	= null;
}

/**
* Consulta el estado de una salida
* @method getEstado
* @param params Objeto JSON con la clave IP del dispositivo, numero de salida, y comando
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @return Boolean Resultado del comando
*/
Salida.prototype.getEstado = function( params, callback ) {
	params.comando = "S" + params.nro_salida;
	socket.send( params, function( response, timeout ) {
		callback(response)
	});
};

/**
* Metodo switch para sobrecarga. Cada Tipo de Salida lo implementa distinto.
* Interactua con el socket enviandole un comando
* @method switch
* @params {JSON Array} params Parametros para el socket, IP dispositivo, Comando, Numero de salida
* @params {Function} callback Function de retorno con resultado del comando enviado al Socket
*/

Salida.prototype.switch = function( params, callback ) {
	if (params.hasOwnProperty('comando')) {
		socket.send( params, function( response, timeout ) {
			callback(response)
		});
	}
};

/**
* Representa una Salida tipo Luz
*
* @class Luz
* @constructor
* @params {Integer} nro_salida Numero de Salida
* @params {String} _note Descripción de Salida
* @params {String} _ip IP del dispositivo Arduino
*/
function Luz( nro_salida, _note, _ip ) {
	Salida.apply(this, [nro_salida, _note]);
	this.ip 	 	 = _ip;
	this.tipo 	 = 'L';
	this.comando = 'T';
};

//Herencia
Luz.prototype = Object.create(Salida.prototype);
Luz.prototype.constructor = Luz;

/**
* Implementación de switch para Luz
*
* @method switch
* @param params Objeto JSON con la clave IP del dispositivo, numero de salida, y comando
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
*/
Luz.prototype.switch = function( params, callback ) {
	var comando = this.comando
							+ this.nro_salida
							+ params.estado
							+ "."
							+ DateConvert.horario_a_min(params.temporizada);

	Salida.prototype.switch({ comando: comando, ip: this.ip}, callback);
};

/**
* Representa una Salida tipo Persiana
* @class Persiana
* @constructor
* @params {Integer} nro_salida Numero de Salida
* @params {String} _note Descripción de Salida
*/

function Persiana( nro_salida, _note ) {
	Salida.apply(this,[nro_salida, _note]);
	this.tipo = this.comando = 'P';
};

Persiana.prototype = Object.create(Persiana.prototype);
Persiana.prototype.constructor = Persiana;

/**
* Implementación de switch para Persiana. Utiliza la accion P
* @method switch
* @param params Objeto JSON con la clave IP del dispositivo, numero de salida, y comando
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
*
* Uso: P + Nro de Salida + Accion (0,1,2)
*	   	0 --> Sube la Persiana
*		1 --> Baja
*		2 --> Detiene
*		Ejemplo: P251 --> Baja la persiana cuya salida es 25
*/
Persiana.prototype.switch = function( params, callback ) {
	var comando = this.comando
				+ this.nro_salida
				+ params.estado;
	Salida.prototype.switch({ comando: comando, ip: this.ip}, callback);
};

/**
* Factory para crear los distintos tipos de Salida
* @method SalidaFactory
* @return {Salida} Objeto Salida segun atributo tipo
*/
function SalidaFactory() {
	this.create = function( nro_salida, _tipo, _note, _ip ) {

		switch (_tipo) {
			case "P":
				return new Persiana(nro_salida, _note, _ip);
				break;
			case "S":
				return new Sensor(nro_salida, _note, _ip);
				break;
			default:
				return new Luz(nro_salida, _note, _ip);
		}
	}
}
exports.Dispositivo = Dispositivo;