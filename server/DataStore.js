/**
 * Módulo para el almacenamiento en memoria, y archivos JSON,
 * de los modelos de la aplicación.
 * Lista de dispositivos y salidas asociadas.
 * Lista de tareas programadas.
 * @module DataStore
*/

var fs	= require('fs'),
	log	= require('./utils/Log');
	_	= require('underscore'),
	Dispositivo = require('./Main').Dispositivo;

/**
* Clase (singleton) para trabajar con archivos JSON
* y almacenar los modelos de la aplicación
*
* @class DataStore
* @constructor
*/

/**
* Listado de dispositivos Arduino registrados
* @property dispositivos
* @type Array
*/
/**
* Listado de tareas programadas registradas
* @property tareas
* @type Array
*/
/**
* Listado de tareas cargadas en scheduler (listas para ejecución)
* @property tareasActivas
* @type Array
*/
function DataStore() {
	this.dispositivos 	= [];
	this.tareas 	  	= [];
	this.getFile = function( file ) {
		var filePath = './models/' + file + '.json';

		if ( !fs.existsSync( filePath ) ) {
			fs.writeFileSync(filePath, '[]');
		}
		
		var content = JSON.parse( fs.readFileSync('./models/' + file + '.json', 'utf8'));
		
		this[file] = content;

		return content;
	};
	this.sortFile = function( file ) {

		var alfabeticSort = ( a, b) => {
			var prev = a.descripcion.toUpperCase();
			var current = b.descripcion.toUpperCase();
			return current < prev ?  1
		         : current > prev ? -1
		         : 0;
		}

		// Ordenamiento por descripcion de dispositivo
		file = file.sort( alfabeticSort );
		
		// Ordenamiento por descripcion de salidas
		file.forEach((disp, k, _this) => { 
			_this[k].salidas.sort(alfabeticSort) 
		});

		return file;
	}
	this.zonas = this.getFile('zonas');
/**
* Método para actualizar JSON
* @method updateDB
*/
	this.updateDB = function( filename, data, removeMemoryData ) {
		if ( data ) {
			if (filename.indexOf('dispositivos') > -1) { 

				// Elimina claves temporales
				if (removeMemoryData) data = this.removeJSONKeys( data );
				
				// Ordenamiento alfabetico
				data = this.sortFile( data );
			}
			
			fs.writeFileSync(filename + '.json', JSON.stringify(data, null, 2),'utf8', { spaces: 2 });

			log("Se actualizó el archivo de  " + filename);

			return true;
		}
		else {
			log("No se pudo actualizar el archivo de " + filename, ". data No es un array");
		}
		return false;
	};
	this.removeMemoryData = function(data) {
		var keys = ['offline','estado', 'accion','comando','ip','temporizada'];
		data.forEach((d) => {
			d.salidas.forEach( ( s, k, _this ) => {
				keys.forEach((_k) => {
					if (Object.keys( s ).indexOf(_k) > -1) {
						delete _this[k][_k];
					}
				});
			});
		});
		return data;
	}
};

DataStore.instance = null;
DataStore.getInstance = function(){
    if(this.instance === null){
        this.instance = new DataStore();
    }
    return this.instance;
}
exports.DataStore = DataStore.getInstance();