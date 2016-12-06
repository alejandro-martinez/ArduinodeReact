/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import Loading from 'react-loading';
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
	}
	static newModel() {
		var model = { 
			ip: "192.168.20.000", 
			descripcion: "Nuevo dispositivo",
			salidas: []
		};

		return model;
	}
	update(db, callback) {
		if (Dispositivo.isValid( db )) {
			super.update(db);
			callback();
		}
	}
	static isValid() { return true; }
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
	static newSubtareaModel( subtareas ) {
		
		if ( subtareas.length ) {
			var subtarea = subtareas.reduce(function(prev, current) {
			    return (prev.fechafin > current.fechafin) ? prev : current
			});
			var horafin = subtarea.horafin, 
				fechafin = subtarea.fechafin;
		}
		else {
			var horafin = "12:00", 
				fechafin = Utils.getDate();
		}

		return { 
			"id": Utils.randomID(),
	        "diasejecucion": "1,2,3,4,5",
	        "fechainicio": fechafin,
	        "fechafin": fechafin,
	        "horainicio": horafin,
	        "horafin": null,
	        "duracion": null
		};
	}
	update(db, callback) {
		if (Tarea.isValid( db )) {
			callback();
			super.update(db);
		}
	}
	// Chequeo de superposicion de fechas de las subtareas
	static isValid( db ) {
		var valid = true;

		db.forEach( ( tarea ) => {
			if (tarea.subtareas.length > 1) { 
				var overlap = (id, fechainicio, fechafin) => {
					valid = true;
					tarea.subtareas.every((s, index) => {
						if ( s.id != id ) {
							var sub_inicio = Utils.parseDate(s.fechainicio).getTime();
							var sub_fin = Utils.parseDate(s.fechafin).getTime();

							if ( fechafin == sub_fin && fechainicio == sub_inicio) {
								valid = false;
							}

							if ( fechafin > sub_inicio && fechainicio < sub_inicio) {
								valid = false;
							}

							if (fechainicio < sub_fin && fechafin > sub_inicio ) {
								valid = false;
							}

							if (fechainicio < sub_inicio &&	fechafin > sub_fin) {
								valid = false;
							}
						}
					});
					return valid;
				}
				
				for (var t in tarea.subtareas) {
					var s = tarea.subtareas[t];
					var sinicio = Utils.parseDate(s.fechainicio).getTime();
					var sfin = Utils.parseDate(s.fechafin).getTime();	
					valid = overlap(s.id, sinicio, sfin );
				};
			}
		});

		if (!valid) {
			alert( "Error: Las fechas de las subtareas se superponen");
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
}

class Footer extends Component {
	constructor(props) {
		super(props);
		['onAddNew','onTimerClick','onUpdate'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});

		this.state = { loading: false };

		Socket.listen('horaServidor', ( hora ) => {
    		this.setState({ horaServidor: new Date(hora).toString().slice(16,24) });
    	});
	}
	componentDidMount() {		
		document.addEventListener("loading",( e ) => {
			this.setState({ loading: e.detail });
		});
	}
	onUpdate() { this.props.root.updateDB(); }
	onAddNew() { Utils.fireEvent("onAddNew"); }
	onTimerClick() { Utils.fireEvent("onTimerClick"); }
	render() {
		return (
			<div className="footer">
				<ul className="listIcons">
					<li className={ 'show' + (this.props.root.state.showAddIcon && this.props.root.state.adminMode)}>
						<a onClick={ this.onAddNew } className='iconMAS'></a>
					</li>
					<li className={'iconReloj show' + this.props.root.state.showTimerIcon}>
						<a onClick={ this.onTimerClick }>
							<span>{ this.props.root.state.temporizacion }</span>
						</a>
					</li>
					<li className={'show' + (this.props.root.state.edit && this.props.root.state.adminMode)}>
						<a onClick={ this.onUpdate } className='iconOK'></a>
					</li>
				</ul>
				<h3>{ this.state.horaServidor }</h3>
				<div id="loading" className={ 'show' + this.state.loading }>
					<Loading type='cylon' color='#e3e3e3' />
				</div> 
			</div>
		);
	}
	
}

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
			adminMode: false,
			temporizacion: "00:00",
			dispositivos: [] 
		};

		this.updateDB = this.updateDB.bind(this);
		this.Dispositivo = new Dispositivo();
		this.Tarea = new Tarea();

		Socket.listen('DBDispositivosUpdated', ( db ) => {
    		this.setState({ dispositivos: db });
    	});

    	Socket.listen('claveApp', ( clave ) => {
    		this.setState({ clave: clave });
    	});
	}
	getDispositivoByIP( ip ) {
		return this.state.dispositivos.filter((d) => { return d.ip == ip; })[0];
	}
	updateDB() {
		var db = this.state.dbActual;
		var dataModel = this.state[ db.concat("s").toLowerCase() ];
		
		if ( this[db].update( dataModel, ()=> {
			this.setState({ edit: false});
		}));
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
				<Footer root={This}></Footer>
	  		</div>
		);
	}
}

export default Arduinode;