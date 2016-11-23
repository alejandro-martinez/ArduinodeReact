/**
 * Módulo para la programación y ejecución de tareas sobre los dispositivos
 *
 * @module Programador de Tareas
 */
var DataStore	= require('./DataStore').DataStore;
var Arduinode	= require('./Arduinode').Arduinode,
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore'),
	schedule 	= require('node-schedule');

function Tarea() {
	this.subtareas 		= [];
	this.dispositivos 	= [];
	this.activa 		= null;
	this.accion 		= null;
	this.descripcion 		= null;
}

//Asignacion masiva de atributos
Tarea.prototype.parseData = function( model ) {

	for ( var i in Object.keys( this ) ) {
		var atributo = Object.keys( this )[ i ];
		this[atributo] = model[atributo];
	}
};

// Herencia
function Subtarea() {
	Tarea.call(this);
	this.reglasEjecucion = {};
	var keys = ['diainicio','diafin','mesinicio','mesfin','horainicio','horafin','duracion','diasejecucion'];

	keys.forEach(( attrib )=> {
		this[attrib] = null;
	});
}

Subtarea.prototype = Object.create(Tarea.prototype);
Subtarea.prototype.constructor = Subtarea;


Subtarea.prototype.parseData = function( model ) {
	Tarea.prototype.parseData.call(this, model);
	this.raw_horainicio = this.horainicio;
	this.horainicio 	= this.raw_horainicio.substr(0,2);
	this.mininicio 		= this.raw_horainicio.substr(-2);	
	this.raw_duracion 	= this.duracion;
	this.diasejecucion 	= DateConvert.strToArray( this.diasejecucion );
	this.temporizada 	= DateConvert.horario_a_min( this.duracion );

	var rule 			= new schedule.RecurrenceRule();
		rule.dayOfWeek 	= this.diasejecucion;
		rule.second 	= 0;
		rule.hour 		= parseInt( this.raw_horainicio );
		rule.minute 	= parseInt( this.mininicio );

	this.reglasEjecucion = rule;
};


Subtarea.prototype.execute = function( accion, callback ) {
	var This = this,
			i = 0,

	loop = function(i) {
		var dispositivo = This.tarea.dispositivos[i];

		if (dispositivo) {
			dispositivo.temporizada = (accion) ? 0 : This.temporizada;
			dispositivo.estado 	 	= (accion) ? accion : This.tarea.accion;
			var onAccion = function(response) {
				i++;
				loop(i);
			};
			Arduinode.dispositivos.accionar(dispositivo, onAccion);
		}
	}
	if (this.tarea.dispositivos.length > i) {
		loop(i);
	}
	else {
		if (callback) callback();
	}
};
Subtarea.prototype.getTiempoRestante = function() {
	return DateConvert.minutosRestantes( this.raw_horainicio, this.raw_duracion );
};
Subtarea.prototype.isFechaValida = function() {
	if ( DateConvert.fechaBetween( this ) ) {
		return DateConvert.diaActualValido( this.diasejecucion );
	}
	return false;
};
Subtarea.prototype.isHorarioValido =  function() {
	return DateConvert.horaActualValida( this.raw_horainicio, this.raw_duracion);
};

/**
* Determina si una tarea es valida para su ejecucion
* Se comprueba el atributo activa, fecha, hora y dias de ejecucion
* @method isValid
* @return Boolean
*/
Subtarea.prototype.isValid = function() {
	
	//Verifica que la tarea esté activa el rango de fechas y que la tarea este activa
	if ( this.tarea.activa ) {
		//Verifica Fecha y Horario
		if ( this.isFechaValida() && this.isHorarioValido() ) {
			//Si la tarea deberia estar ejecutandose, calcula el tiempo restante
			var min_rest = this.getTiempoRestante();
			if ( min_rest > 0 ) {
				return min_rest;
			}
		}
	}
	return false;
};

function Programador() {
	this.setConfig = function( config ) {
		this.config = config;
	};
	this.tareas			= [];
	this.tareasActivas	= [];
	this.reprogramTarea = function( _tarea ) {
		this.removeTareaScheduler( _tarea );
		this.loadScheduler( false );
	};
	/**
* Quita una tarea del array de tareasActivas de DataStore
* @method quitarTareaEnEjecucion
* @param tarea la tarea a quitar
* @return null
*/
	this.removeTareaScheduler = function( id ) {
		var remove = false;
		this.tareasActivas.forEach(function(s, k,_this) {
			if (s.id == id) {
				remove = true;
				delete _this[k];
			}
		});
		return remove;
	};
	this.watchChanges 	= function() {
		var This = this;
		console.log("Observando las tareas cada ",
					parseInt((this.config.tiempoEscaneoTareas / 1000) / 60),
					" minutos ...");

		var onInterval = function() {
			This.refresScheduler();
		}
		setInterval( onInterval, this.config.tiempoEscaneoTareas );
	};
	this.refresScheduler = function() {
		var This = this;
		This.tareas.forEach(function( tarea ) {

			This.forceExecute( tarea.obj );
		});
	};
	/**
* Intenta ejecutar una tarea forzosamente. Comprobando si es valida,
* y el tiempo restante.
* @method forceExecute
* @param tarea objeto tarea (instancia de Tarea)
* @return null
*/
	this.forceExecute = function( subtarea ) {
		if (subtarea.tarea.accion == 0) {
			if (subtarea.isValid() ) {
				subtarea.temporizada = subtarea.getTiempoRestante();
				subtarea.execute();
			}
			else {
				console.log(subtarea.tarea.descripcion, " no es valida");
			}
		}
	};
	this.createJob = function( tarea ) {
		var job = schedule.scheduleJob( tarea.reglasEjecucion, function() {
			
			if ( tarea.isValid() ) {
				tarea.execute();
			}
		});
		job.id = tarea.id;
		this.tareasActivas.push( job );
	};
/**
* Importa listado de tareas desde archivo JSON, a DataStore.tareas
* y las carga en scheduler.
* @method loadTareas
*/	
	this.loadScheduler = function( reloadJobs ) {
		var This = this;
		this.tareas = [];
		this.tareasJSON = DataStore.getFile('tareas');
		var tareasAux = JSON.parse(JSON.stringify(this.tareasJSON ))
		
		for (var t in tareasAux) {
			var tarea = new Tarea();
			tarea.parseData( tareasAux[t] );
			
			tarea.subtareas.forEach(function(s,k,_this) {
				_this[k].obj = new Subtarea();
				_this[k].obj.parseData( s );
				_this[k].obj.tarea = tarea;
				
				This.tareas.push(_this[k]);
				
				if ( reloadJobs ) {
					This.createJob( _this[k].obj )
				}
			});			
		}
		delete tareasAux;
		return this;
	};
}

Programador.instance = null;
Programador.getInstance = function(){
    if(this.instance === null){
        this.instance = new Programador();
    }
    return this.instance;
}
module.exports = Programador.getInstance();