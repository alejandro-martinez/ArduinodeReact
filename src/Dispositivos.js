/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router, Route, hashHistory } from 'react-router';
import Socket from './Socket';
import * as HTML from './HTML';

class Model {
	constructor( db ) {
		this.jsonDB = db;
	}
	save() {
		console.log("Parent")
	}
}

class DispositivosModel extends Model {
	constructor() {
		super();
		this.cached = [];
	}
	static getAll() {

		var promise = new Promise((resolve, reject) => {
			
			Socket.listen('dispositivos', ( dispositivos ) => {
				this.cached = dispositivos;
				resolve( this.cached );
			});

			Socket.emit('getDispositivos');
		});
		
		return promise;
	}
	static getByIP( ip ) {

		var promise = new Promise((resolve, reject) => {  

			if ( this.cached ) {
				resolve( this.cached );
			}
			else {
				this.getAll().then( (dispositivos ) => {
					var found = this.cached.filter( function( v, k, _this ){
						if ( v.ip === ip ) {
							return _this[k];
						}
					});

					resolve ( found[0] || null );
				});
			}
		});

		return promise;
	}
	static save( newModel ) {
		console.log("Child")
		var model = DispositivosModel.getByIP( this.props.params.ip );
		console.log("OLD model",model)
		model = newModel;
		console.log("New model",model)
		// trigger socket update
	}
}

class ListaDispositivos extends Component {
	constructor( props ) {
		super( props );
		this.state = { dispositivos: [] };
	}
	componentDidMount() {
		const This = this;
		DispositivosModel.getAll().then(( dispositivos ) => {
			This.setState({ dispositivos: dispositivos });
		});
	}
	generateRow( item ) {
		return (
			<tr>
				<td> <HTML.LinkButton url={ 'Salidas/' + item.ip } text={ item.note } /></td>
				<td> { item.version } </td>
				<td> <HTML.LinkButton class={ 'iconEdit' } 
									  url={ 'Dispositivo/' + item.ip } 
									  text={''} /> </td>
			</tr>
		);
	}
	render() {
		if ( this.state.dispositivos.length ) {
			var rows = this.state.dispositivos.map( this.generateRow );
	    	return ( <div> { rows } </div> );
    	}
    	else {
    		return ( <div> Cargando ...</div>)
    	}
	}
};
export class DispositivoEdit extends Component {
	constructor( props ) {
		super(props);
		this.state = { dispositivo: {}, valid: false }
		this.changed = this.changed.bind( this );
		this.onSubmit = this.onSubmit.bind( this );
	}
	componentDidMount() {
		
		DispositivosModel.getByIP( this.props.params.ip ).then((model) => {
			this.setState({ dispositivo:  model });
		});
	}
	changed(e) {
		e.preventDefault();
		var dispositivo = this.state.dispositivo;
		dispositivo[e.target.name] = e.target.value;
		this.setState({ dispositivo: dispositivo });
	}
	onSubmit( e ) {
    	e.preventDefault();
    	DispositivosModel.save( this.state.dispositivo );
	}
	render() {
		return ( 
			<form className={'formValid' + this.state.valid } ref="DispositivoForm" id="DispositivoForm" onSubmit={this.onSubmit}>
				Descripción
				<input type="text" name="note" required min-length='1' onChange={this.changed} ref="note" value={this.state.dispositivo.note} />
				IP
				<input type="text" name="ip" required max-length='15' min-length='8' ref="ip" onChange={this.changed} value={this.state.dispositivo.ip} />
				<button type="submit" className="button">Guardar</button>
			</form>
		);
	}
};


export class Dispositivos extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		return ( 
			<div>
				<HTML.Table class="dispositivos">
					<ListaDispositivos />
				</HTML.Table>
				<HTML.LinkButton text="Nuevo" url="Dispositivos/create" class="button" />
			</div>
		);
	}
};