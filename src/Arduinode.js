/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import { Dispositivos } from './Dispositivos';
import { SalidasDispositivo, SalidasActivas } from './Salidas';
import { Tareas, Subtareas } from './Tareas';

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
	get( emit ) {
		return new Promise((resolve, reject) => {
	    	Socket.listen('DB' + this.filename +'Updated', ( db ) => {
	    		resolve( db );
	    	});
	    	if (emit) Socket.emit('get' + this.filename + 'DB');
	    });
	}
	update( db ) {
		Socket.emit('update'+ this.filename +'DB', db );
	}
}
export class Validator {
	static isValidNOTE() {
		return true;
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
			note: "Nuevo dispositivo",
			salidas: []
		};

		return model;
	}
	static isValidNOTE = Validator.isValidNOTE;
	static isValidIP = Validator.isValidIP;
}

export class Tarea extends DB {
	constructor() {
		super('Tareas');
	}
	static newModel() {
		return {
		    "note": "Nueva tarea",
		    "id": Math.random().toString(36).slice(18),
		    "dispositivos": [],
		    "subtareas": [],
		    "accion": 0,
		    "activa": 1	    
		}
	}
	static newSubtareaModel() {
		return { 
			"id": Math.random().toString(36).slice(18),
	        "diasejecucion": "1,2,3,4,5",
	        "fechainicio": Utils.getDate(),
	        "fechafin": Utils.getDate(),
	        "duracion": "01:00",
	        "horainicio": "00:00",
	        "horafin": "00:00"
		};
	}
	static isValidNOTE = Validator.isValidNOTE;
}

class Home extends Component {
	render() { 
		return ( <HTML.ListaLinks items={ menu } /> ); 
	}
};

class Arduinode extends Component {
	constructor( props ) {
		super( props );
		this.state = { dispositivos: [] };
		this.updateDB = this.updateDB.bind(this);
		this.Dispositivo = new Dispositivo();
	}
	componentWillMount() {
		this.Dispositivo.get().then(( data )=> {
			this.setState({ dispositivos: data });
		});
	}
	updateDB() {
		this.Dispositivo.update( this.state.dispositivos );
	}
	render() {
		const This = this;
		return (
			<div className="Arduinode">
				
				<HTML.Header titulo="Home" />

				<div className="container">
					<Router history={ hashHistory }>
						<Route path="/" component={ Home } />
						<Route root={This} path="Tareas" component={ Tareas } />
						<Route root={This} path="Tareas/subtareas/:id" component={ Subtareas } />
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