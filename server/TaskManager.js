"use strict";

/**
 * Módulo para la programación y ejecución de tareas sobre los dispositivos
 *
 * @module Programador de Tareas
 */
var DataStore	= require('./DataStore').DataStore;
var Arduinode	= require('./Arduinode').Arduinode,
	Arrays 		= require('./utils/Arrays')(),
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore'),
	schedule 	= require('node-schedule');

class Tarea {
	constructor( model ) {
		if ( model ) { 
			this.dispositivos 	= [];
			this.activa 		= null;
			this.accion 		= null;
			this.descripcion 	= null;
			this.parseData( model );
		}		
	}
	parseData( model ) {

		for ( var i in Object.keys( this ) ) {
			var atributo = Object.keys( this )[ i ];
			this[atributo] = model[atributo];
		}
	}
}
// Herencia
class Subtarea extends Tarea {
	constructor( model ) {
		super();
		this.reglasEjecucion = {};
		this.raw_horainicio = model.horainicio;
		this.horainicio 	= this.raw_horainicio.substr(0,2);
		this.mininicio 		= this.raw_horainicio.substr(-2);	
		this.raw_duracion 	= model.duracion;
		this.diasejecucion 	= DateConvert.strToArray( model.diasejecucion );
		this.temporizada 	= DateConvert.horario_a_min( model.duracion );

		var rule 			= new schedule.RecurrenceRule();
			rule.dayOfWeek 	= this.diasejecucion;
			rule.second 	= 0;
			rule.hour 		= parseInt( this.raw_horainicio );
			rule.minute 	= parseInt( this.mininicio );

		this.reglasEjecucion = rule;
	}
	getTiempoRestante() {
		return DateConvert.minutosRestantes( this.raw_horainicio, this.raw_duracion );
	}
	isFechaValida () {
		if ( DateConvert.fechaBetween( this ) ) {
			return DateConvert.diaActualValido( this.diasejecucion );
		}
		return false;
	}
	isHorarioValido() {
		return DateConvert.horaActualValida( this.raw_horainicio, this.raw_duracion);
	}
	isValid() {
		console.log("subtarea activa?=",this.activa)
		//Si la tarea deberia estar ejecutandose, retorna el tiempo restante
		if ( this.activa && ( this.isFechaValida() && this.isHorarioValido() )) {

			if ( this.getTiempoRestante() > 0 ) return this.getTiempoRestante();
		}
		return false;
	};
}


const Programador = class {
	constructor() {
		this.tareas	= [];
		['refreshScheduler','forceExecute','createJob','execute'].forEach((m)=>{
			this[m] = this[m].bind(this);
		})
	}
	setConfig( config ) { this.config = config }
	reprogramTarea( _tarea ) {
		this.removeTareaScheduler( _tarea );
		this.loadScheduler( false );
	};
	/**
* Quita una tarea del array de tareasActivas de DataStore
* @method quitarTareaEnEjecucion
* @param tarea la tarea a quitar
* @return null
*/
	removeTareaScheduler( id ) {
		var remove = false;
		this.tareas.forEach((s, k,_this) => {
			if ( s.id == id ) {
				remove = true;
				delete _this[k];
			}
		});
		return remove;
	}
	watchChanges() {
		console.log("Observando las tareas cada ",
					parseInt((this.config.tiempoEscaneoTareas / 1000) / 60),
					" minutos ...");
		setInterval( this.refreshScheduler, this.config.tiempoEscaneoTareas );
	}
	refreshScheduler() {
		this.tareas.forEach( tarea => { tarea.subtareas.map( this.forceExecute ) });
	}
	execute ( subtarea, accion, callback ) {
		
		Arrays.asyncLoop( subtarea.tarea.dispositivos, ( d, report ) => {
				d.temporizada = (accion) ? 0 : subtarea.temporizada;
				d.estado 	 	= (accion) ? accion : subtarea.accion;
				Arduinode.dispositivos.switch( d );
		},() => { if (callback) callback() });
		
		return this;
	}
	/**
* Intenta ejecutar una tarea forzosamente. Comprobando si es valida,
* y el tiempo restante.
* @method forceExecute
* @param tarea, subtarea
* @return null
*/
	forceExecute( subtarea ) {
		// Se forza la ejecucion solo si es una tarea de encendido
		if ( subtarea.tarea.accion === 0 ) {
			subtarea.temporizada = subtarea.getTiempoRestante();
			this.execute( subtarea );
		}
	}
	createJob( subtarea ) {
		if ( subtarea.reglasEjecucion ) {
			console.log(subtarea.reglasEjecucion)
			var job = schedule.scheduleJob( subtarea.reglasEjecucion,() => { 
				if ( subtarea.isValid() ) {
					this.execute( subtarea );	
				}				
			});
			subtarea.job = job;
		}
	}
/**
* Importa listado de tareas desde archivo JSON y las carga en el scheduler.
* @method loadTareas
*/	
	loadScheduler( reloadJobs ) {
		this.tareas = [];
		
		var db = DataStore.getFile('tareas');

		for (var _tarea in db) {

			var tarea = new Tarea( db[_tarea] );
			
			if ( db[_tarea].subtareas ) {
				tarea['subtareas'] = [];
				db[_tarea].subtareas.map(s => { 
					var subtarea = new Subtarea( s );
					subtarea.tarea = tarea;
					tarea.subtareas.push(subtarea);
				});
			}

			this.tareas.push( tarea );
			if ( reloadJobs ) tarea.subtareas.map( this.createJob );
		}
		return this;
	};
}
module.exports = new Programador();