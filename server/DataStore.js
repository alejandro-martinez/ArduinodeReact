/**
 * Módulo para el almacenamiento en memoria, y archivos JSON,
 * de los modelos de la aplicación.
 * Lista de dispositivos y salidas asociadas.
 * Lista de tareas programadas.
 * @module DataStore
*/

var fs	= require('fs'),
	log	= require('./utils/Log');
	_	= require('underscore');

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
	this.dispositivos = [];
	this.tareas 	  = [];
	this.getFile = function( file ) {
		var filePath = './models/' + file + '.json';

		if ( !fs.existsSync( filePath ) ) {
			fs.writeFileSync(filePath, '[]');
		}

		var content = JSON.parse( fs.readFileSync('./models/' + file + '.json', 'utf8'));
		this[file] = content;
		return content;
	};
/**
* Método para actualizar JSON
* @method updateDB
*/
	this.updateDB = function( filename, data ) {
		if ( data && Array.isArray( data )) {
			
			fs.writeFileSync('./models/' + filename + '.json', 
									JSON.stringify(data, null, 2),
									'utf8', 
									{ spaces: 2 });
			log("Se actualizó el archivo de  " + filename);
			return true;
		}
		else {
			log("No se pudo actualizar el archivo de " + filename, ". data No es un array");
		}
		return false;
	};
};

DataStore.instance = null;
DataStore.getInstance = function(){
    if(this.instance === null){
        this.instance = new DataStore();
    }
    return this.instance;
}
exports.DataStore = DataStore.getInstance();