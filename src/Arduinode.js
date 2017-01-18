/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import Loading from 'react-loading';
import { Dispositivos } from './Dispositivos';
import { Luz, SalidasDispositivo, SalidasActivas } from './Salidas';
import { Tareas, TareaDispositivos, Subtareas } from './Tareas';
import { Configuracion, Ajustes } from './Configuracion';
import { Zonas, ZonasDispositivos } from './Zonas';

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
		"text": "Zonas",
		"url": "/Zonas"
	},
	{
		"text": "Tareas programadas",
		"url": "/Tareas"
	},
	{
		"text": "Configuración",
		"url": "/Configuracion"
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
		return true;
	}
	static isValidIP( ip ) {		
		return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)$/.test(ip));
	}
}

export class Zona extends DB {
	constructor() {
		super('Zonas');
	}
	static newModel() {
		var model = { 
			id: Utils.randomID(),
			descripcion: "Nueva zona",
			dispositivos: []
		};

		return model;
	}
	update(db, callback) {
		super.update(db);
		callback();
	}
	static isValidDESCRIPCION = Validator.isValiddescripcion;
	static isValidIP = Validator.isValidIP;
}

export class Dispositivo extends DB {
	constructor() {
		super('Dispositivos');
	}
	static newModel() {
		var model = { 
			ip: "192.168.20.", 
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

		var overlap = (subtareas, subtarea) => {

			var fechainicio = Utils.parseDate( subtarea.fechainicio ).getTime();
			var fechafin = Utils.parseDate( subtarea.fechafin ).getTime();	
			
			subtareas.every((s, index) => {
				if ( s.id != subtarea.id ) {
					var sub_inicio = Utils.parseDate( s.fechainicio ).getTime();
					var sub_fin = Utils.parseDate( s.fechafin ).getTime();

					if ( fechafin == sub_fin && fechainicio == sub_inicio) {
						valid = false;
					}

					if ( fechafin > sub_inicio && ( fechainicio < sub_inicio) 
												|| ( fechainicio < sub_fin ) ) {
						valid = false;
					}

					if (fechainicio < sub_inicio &&	fechafin > sub_fin) {
						valid = false;
					}
				}
			});
			return valid;
		}
		/* Compara cada subtarea, con el total de subtareas
		* y verifica si se superponen las fechas de inicio / fin */

		db.forEach( ( tarea ) => {
			if (tarea.subtareas.length) { 
				for (var t in tarea.subtareas) {
					if ( tarea.accion === 1) { 
						tarea.subtareas[t].duracion = '00:00'
					}
					valid = overlap( tarea.subtareas, tarea.subtareas[t] );
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
	render() { return ( <HTML.ListaLinks root={ this.props.route.root } items={ menu } /> ); }
}

class Voice {
	static listen( callback ) {

		var webkitSpeechRecognition = window.webkitSpeechRecognition || {};
		if ( window.hasOwnProperty('webkitSpeechRecognition') ) {
			var recognition = new webkitSpeechRecognition();
			recognition.abort();
			var noVoiceHandler = null;
			recognition.lang = "es-ES";

			noVoiceHandler = setTimeout(function() {
				recognition.abort();
				callback();
			},2000);

			recognition.onspeechstart = function() {
				Utils.fireEvent("speaking");
				clearTimeout( noVoiceHandler );
			}
			
			recognition.onresult = function(event) {
				recognition.onend = null;
				if (event.results.length) {
					callback( event.results[0][0].transcript.toLowerCase() );
				}
				else {
					callback();
				}
			}

			recognition.start();
		}
	}
	static speak(text, callback = function(){}) {
	    var u = new SpeechSynthesisUtterance();
	    speechSynthesis.cancel();
	    u.text = text;
	    u.lang = 'es-ES';
	    u.onend = callback;
	    u.onerror = callback;
	 
	    speechSynthesis.speak(u);
	}
	static getComando( comando ) {
		comando = comando.toLowerCase();
		var orden = comando.split(" ");
		var esComandoZona = (orden[1] === 'zona');

		return {
			orden: orden[0].trim(),
			dispositivo: orden.slice( (esComandoZona) ? 2 : 1 ).join(" ").trim(),
			salida: (esComandoZona) ? 'zona' : orden.slice(1).join(" ").trim(),
			voiceMsg: (orden[0] == 'apagar') ? 'Apagando' : 'Prendiendo'
		};
	}
}

class Footer extends Component {
	constructor(props) {
		super(props);
		['onAddNew','onTemporizacion','onUpdate','onTimerReset'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});

		this.state = { loading: false };
		Socket.listen('horaServidor', ( hora ) => {
    		this.setState({ horaServidor: new Date(hora).toString().slice(16,21) });
    	});
	}
	componentDidMount() {		
		document.addEventListener("loading",( e ) => {
			this.setState({ loading: e.detail });
		});
	}
	onUpdate() { this.props.root.updateDB(); }
	onAddNew() { 
		this.props.root.setState({listenBroadcastUpdate: false});
		Utils.fireEvent("onAddNew"); 
	}
	onTemporizacion(e) { 
		if (!e.target.value) e.target.value = "00:00";
		this.props.root.setState({temporizacion: e.target.value});
	}
	onTimerReset() { this.props.root.setState({ temporizacion: '00:00'})}
	render() {
		var showAddIcon = (this.props.root.state.showAddIcon && 
						   this.props.root.state.adminMode && 
						   !this.props.root.state.edit)
		return (
			<div className={"footer " + this.props.class}>
				<ul className="listIcons">
					<li className={ 'show' + showAddIcon}>
						<a onClick={ this.onAddNew } className='iconMAS'></a>
					</li>
					<li className={'iconReloj show' + this.props.root.state.showTimerIcon}>
						<input type="time" onChange={ this.onTemporizacion } 
									   value={ this.props.root.state.temporizacion } />
					</li>
					<li className={"iconMICROFONO show" + !this.props.root.state.adminMode}>
						<a onClick={ this.props.root.onVoiceCommand }>🎤</a>
					</li>
					<li className={'iconDELETE show' + (this.props.root.state.temporizacion != '00:00')}>
						<a onClick={ this.onTimerReset }></a>
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
			listenBroadcastUpdate: true,
			dbActual: "Dispositivo", 
			page: "Home", 
			edit: false,
			showAddIcon: false,
			showTimerIcon: false,
			tareas: [], 
			adminMode: false,
			temporizacion: "00:00",
			dispositivos: [],
			zonas:[],
			speaking: false,
			listeningVoice: false,
			voiceCommand: ""
		};
		this.updateDB = this.updateDB.bind(this);
		this.onVoiceCommand = this.onVoiceCommand.bind(this);
		this.Dispositivo = new Dispositivo();
		this.Tarea = new Tarea();
		this.Zona = new Zona();

		Socket.listen('configUpdated', ( config ) => {
			this.setState({ config: config, edit: false });
    	});

		Socket.listen('DBDispositivosUpdated', ( db ) => {
			if ( this.state.listenBroadcastUpdate || !this.state.adminMode) {
				this.setState({ dispositivos: db },() => this.updateEstadosZonas());
			}
    	});
    	Socket.listen('DBZonasUpdated', ( db ) => {
			if ( this.state.listenBroadcastUpdate ) {
				this.setState({ zonas: db }, () => this.updateEstadosZonas());
			}
    	});

    	Socket.listen('failed', () => {
    		Voice.speak("No se pudo realizar la acción", function () {});
    	});
	}
	componentDidMount() {
		document.addEventListener("speaking", () => {
			this.setState({ speaking: true, listeningVoice: true });
			this.forceUpdate();
		});
	}
	onVoiceCommand() {
		this.setState({ listeningVoice: true, voiceCommand: "" });

		Voice.listen(( comando ) => {
			if (comando) {
				this.setState({ voiceCommand: comando });

				// Devuelve el comando formateado
				var comando = Voice.getComando( comando );
				
				var This = this;
				
				setTimeout(()=>{
					This.setState({ listeningVoice: false, voiceCommand: "" });
				}, 1000);

				switch( comando.salida ) {
					case "todo":
						Socket.emit('apagarTodo');
						break;
					case "zona":
						Socket.emit('switchZona',comando);	
						break;
					default: 
						Socket.emit('switchSalida',comando);
						break;
				}
			}
			else {
				this.setState({ listeningVoice: false }, function() {
					Voice.speak("No escuché nada");	
				});
			}
		});
	}
	getEstadoSalida( params ) {
		var disp = this.getDispositivoByIP( params.ip );
		if (disp && !disp.offline) {
			var found = disp.salidas.filter(function(s, k, _this) { 
				return s.nro == params.nro;
			});
			if (found.length) return found[0].estado;	
		}

		return 1;
	}
	findZonaByDescripcion( descripcion ) {
		var zona = this.state.zonas.filter((z, k, _this) => {
			return z.descripcion.toLowerCase() == descripcion;
		});
		return zona[0] || [];
	} 
	updateEstadosZonas() {
		if (this.state.zonas.length) {
			var encendidas = 0;
			this.state.zonas.forEach((z, k, _this) => {
				
				z.dispositivos.forEach((s) => {
					s.estado = this.getEstadoSalida( s );
					if (s.estado == 0) encendidas++;
				});
				_this[k].estado = (encendidas === z.dispositivos.length) ? 0 : 1;
			});
			this.forceUpdate();
		}
	}
	getDispositivoByIP( ip ) {
		return this.state.dispositivos.filter((d) => { return d.ip == ip; })[0];
	}
	updateDB() {
		var db = this.state.dbActual;
		if (db != 'config') {
			var dataModel = this.state[ db.concat("s").toLowerCase() ];
			
			if ( this[db].update( dataModel, ()=> {
				this.setState({ edit: false, listenBroadcastUpdate: true});
			}));
		}
		else {
			Socket.emit('updateConfigDB', this.state.config);
		}
	}
	render() {
		const This = this;
		var showMic = (this.state.voiceCommand && this.state.voiceCommand.length === 0);
		var micText = '';
		return (
			<div className={"Arduinode adminMode" + This.state.adminMode}>
				
				<HTML.Header root={This} class={"show" + !this.state.listeningVoice} />
				<div className={"mic show" + this.state.listeningVoice}>
					<div className={"googleNowMic speaking" + this.state.speaking}>
						<div className="mc"></div>
					</div>
					<p className={"show" + showMic}>Decí algo como: "Prender baño", "Apagar zona Patio" o "Apagar todo"</p>	
					<h1>{ this.state.voiceCommand }</h1>
				</div>
				<div className={'container show' + !this.state.listeningVoice}>
					<Router history={ hashHistory }>
						<Route root={This} path="/" component={ Home } />
						<Route root={This} path="Tareas" component={ Tareas } />
						<Route root={This} path="Tareas/subtareas/:id" component={ Subtareas } />
						<Route root={This} path="Tareas/:id/dispositivos" component={ TareaDispositivos } />
						<Route root={This} path="Zonas" component={ Zonas } />
						<Route root={This} path="Zonas/:id/dispositivos" component={ ZonasDispositivos } />
						<Route root={This} path="Dispositivos" component={ Dispositivos } />
						<Route root={this} path="Dispositivos/salidasOn" component={ SalidasActivas } />
						<Route root={This} path="Dispositivos/salidas/:ip" component={ SalidasDispositivo } />
						<Route root={This} path="Configuracion" component={ Configuracion } />
						<Route root={This} path="Configuracion/Ajustes" component={ Ajustes } />
					</Router>
				</div>
				<Footer root={This} class={"show" + !this.state.listeningVoice}></Footer>
	  		</div>
		);
	}
}

export default Arduinode;