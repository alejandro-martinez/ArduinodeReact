/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import { Dispositivos } from './Dispositivos';
import { SalidasDispositivo, SalidasActivas } from './Salidas';
import { Tareas, TareaDispositivos, Subtareas } from './Tareas';

var menu = [
  {
    "text": "Dispositivos",
    "url": "/Dispositivos"
  },
  {
    "text": "Luces encendidas",
    "url": "/Dispositivos/salidasOn"
  },
  {
    "text": "Tareas programadas",
    "url": "/Tareas"
  }
];

export class DB {
	constructor( filename ) {
		this.filename = filename;
	}
	get() {	
	    Socket.emit('get' + this.filename + 'DB');
	}
	update( db ) {
		Socket.emit('update'+ this.filename +'DB', db );
	}
}
export class Validator {
	static isValidDESCRIPCION( descripcion ) { 
		return descripcion && descripcion.length;
	}
	static isValidIP( ip ) {		
		return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip));
	}
}


export class Dispositivo extends DB {
	constructor() {
		super('Dispositivos');
		this.errors = null;
	}
	static newModel() {
		var model = { 
			ip: "192.168.20.000", 
			descripcion: "Nuevo dispositivo",
			salidas: []
		};

		return model;
	}
	static isValidDESCRIPCION = Validator.isValiddescripcion;
	static isValidIP = Validator.isValidIP;
}

export class Tarea extends DB {
	constructor() {
		super('Tareas');
	}
	static newModel() {
		return {
		    "descripcion": "Nueva tarea",
		    "id": Utils.randomID(),
		    "dispositivos": [],
		    "subtareas": [],
		    "accion": 0,
		    "activa": 1	    
		}
	}
	static newSubtareaModel() {
		return { 
			"id": Utils.randomID(),
	        "diasejecucion": "1,2,3,4,5",
	        "fechainicio": Utils.getDate(),
	        "fechafin": Utils.getDate(),
	        "duracion": "01:00",
	        "horainicio": "00:00",
	        "horafin": "00:00"
		};
	}
	static validSubtarea(subtarea, subtareas) {
		console.log(subtareas)
		var valid = true;

		for ( var s in subtareas ) {
			var _s = subtareas[s];
			if ( _s.id != subtarea.id ) {
				/*   3  6
				*
				*  1      7 	-> invalida
				*/
				if (subtarea.mesinicio <= _s.mesinicio 
					&& _s.mesfin <= subtarea.mesfin ) {
					valid = false;
					break;
				}
				/* 3     6
				*
				*     4    7 	-> invalida
				*/
				if (subtarea.mesinicio > _s.mesinicio 
				 && subtarea.mesinicio < _s.mesfin ) {
					valid = false;
					break;
				}
				
				/*    3     6
				*
				*  1     5 		-> invalida
				*/
				if (subtarea.mesinicio < _s.mesinicio 
				 && subtarea.mesfin > _s.mesinicio) {
					valid = false;
					break;
				}
			}
		}
		return valid;
		
	}
	static isValidDESCRIPCION = Validator.isValidDESCRIPCION;
}

class Home extends Component {
	componentDidMount() { 
		this.props.route.root.setState({ 
			page: "Home", 
			showAddIcon: false,
			showTimerIcon: false
		});
	}
	render() { return ( <HTML.ListaLinks items={ menu } /> ); }
};

class Arduinode extends Component {
	constructor( props ) {
		super( props );
		
		this.state = { 
			dbActual: "Dispositivo", 
			page: "Home", 
			edit: false,
			showAddIcon: false,
			showTimerIcon: false,
			tareas: [], 
			temporizacion: "00:00",
			dispositivos: [] 
		};

		this.updateDB = this.updateDB.bind(this);
		this.Dispositivo = new Dispositivo();
		this.Tarea = new Tarea();
		Socket.listen('DBDispositivosUpdated', ( db ) => {
    		this.setState({ dispositivos: db });
    	});
	}
	updateDB() {
		var db = this.state.dbActual;
		this[db].update( this.state[ db.concat("s").toLowerCase() ] );
		this.setState({ edit: false });
	}
	render() {
		const This = this;
		return (
			<div className="Arduinode">
				
				<HTML.Header root={This} />

				<div className="container">
					<Router history={ hashHistory }>
						<Route root={This} path="/" component={ Home } />
						<Route root={This} path="Tareas" component={ Tareas } />
						<Route root={This} path="Tareas/subtareas/:id" component={ Subtareas } />
						<Route root={This} path="Tareas/:id/dispositivos" component={ TareaDispositivos } />
						<Route root={This} path="Dispositivos" component={ Dispositivos } />
						<Route root={this} path="Dispositivos/salidasOn" component={ SalidasActivas } />
						<Route root={This} path="Dispositivos/salidas/:ip" component={ SalidasDispositivo } />
					</Router>
				</div>
	  		</div>
		);
	}
}

export default Arduinode;