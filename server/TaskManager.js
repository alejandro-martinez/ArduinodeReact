"use strict";

/**
 * Módulo para la programación y ejecución de tareas sobre los dispositivos
 * @module Programador de Tareas
 */
var DataStore	= require('./DataStore').DataStore;
var Arduinode	= require('./Arduinode'),
	Arrays 		= require('./utils/Arrays')(),
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore'),
	log			= require('./utils/Log'),
	schedule 	= require('node-schedule');

class Tarea {
	constructor( model ) {
		if ( model ) { 
			this.id 			= null;
			this.dispositivos 	= [];
			this.activa 		= null;
			this.accion 		= null;
			this.enEjecucion	= false;
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

class Subtarea extends Tarea {
	constructor( model ) {
		super();
		this.reglasEjecucion = {};
		this.fechainicio 	= model.fechainicio;
		this.fechafin 		= model.fechafin;
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
		if (this.tarea.accion == 1) return true;

		//Si la tarea deberia estar ejecutandose y es de Encendido
		if ( this.tarea.activa && this.isFechaValida() ) {
			if ( this.isHorarioValido() ) {
				if ( this.getTiempoRestante() > 0 ) return this.getTiempoRestante();
			}
			else {
				log(0, "Horario inválido");
			}
		} else {
			log(0, (this.tarea.activa) ? "Fecha inválida" : "Tarea inactiva");
		}
		return false;
	};
}


const Programador = class {
	constructor() {
		this.tareas	= [];
		this.io = {};
		this.watcher = null;

		['refreshScheduler','forceExecute','createJob','execute'].forEach((m)=>{
			this[m] = this[m].bind(this);
		})
	}
	setConfig( config ) { 
		this.config = config;
		clearInterval( this.watcher );
		return this;
	}
	watchChanges() {
		log(0, "Observando las tareas cada " +
					parseInt((this.config.tiempoEscaneoTareas / 1000) / 60) +
					" minutos ...");
		this.watcher = setInterval( this.refreshScheduler, this.config.tiempoEscaneoTareas );
	}
	refreshScheduler() {
		this.tareas.forEach( tarea => { tarea.subtareas.map( this.forceExecute ) });
	}
	registerRunningTasks( id, running ) {
		var tarea = DataStore.tareas.filter((t)=>{
			return t.id == id;
		});
		tarea[0].enEjecucion = running;
		if (Arduinode.io.hasOwnProperty('sockets')) {
			Arduinode.io.sockets.emit('DBTareasUpdated', DataStore.tareas);
		}
	}
	execute ( subtarea, accion, callback ) {
		Arrays.asyncLoop( subtarea.tarea.dispositivos, ( d, report ) => {
			if (d) {
				d.temporizada = (accion) ? 0 : subtarea.temporizada;
				d.estado 	  = (accion) ? accion : subtarea.tarea.accion;

				Arduinode.switchSalida( d, (response) => { 
					report();
				});
			}
		},() => { 
			if (callback) callback();
		});
		
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
		var onTask = (subtarea.tarea.accion == 0);
		log(0, "Chequeando tarea: " + subtarea.tarea.descripcion);
		
		// Se forza la ejecucion solo si es una tarea de encendido
		if ( onTask && subtarea.isValid()) {
			subtarea.tarea.enEjecucion = false;
			subtarea.temporizada = subtarea.getTiempoRestante();
			this.registerRunningTasks( subtarea.tarea.id, true);
			this.execute( subtarea );
		}
		else {
			this.registerRunningTasks( subtarea.tarea.id, false);
			log(0, "La tarea no" + ((onTask) ? " es válida" : " se debe ejecutar"));
		}
	}
	createJob( subtarea ) {
		
		delete subtarea.job;

		if ( subtarea.reglasEjecucion ) {
			var job = schedule.scheduleJob( subtarea.reglasEjecucion,() => { 
				if ( subtarea.isValid() ) {
					log(0, "Ejecutando tarea" + subtarea.tarea.descripcion);
					this.execute( subtarea );	
				}				
			});
			subtarea.job = job;
		}
	}
	getTareas() {
		return this.tareas;
	}
/**
* Importa listado de tareas desde archivo JSON y las carga en el scheduler.
* @method loadTareas
*/	
	loadScheduler( reloadJobs ) {
		this.tareas = [];
		log(0, "- Leyendo archivo de tareas");
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
			if ( reloadJobs ) {
				tarea.subtareas.map( this.createJob );
			}
		}
		log(0, "--- " + this.tareas.length + " tareas cargadas");
		return this;
	};
}
module.exports = new Programador();