/*jshint esversion: 6 */
import React, { Component } from 'react';
import Socket from './Socket';
import { Link } from 'react-router';
import * as HTML from './HTML';

class Model {
	constructor( db ) {
		this.jsonDB = db;
	}
	save() {
		console.log("Parent")
	}
}

export class DispositivosModel extends Model {
	constructor() {
		super();
		this.lista = [];
		this.model = { ip: "", note: "Nuevo" };
		
	}
	static isValid() {
		return true;
	}
	static save( newModel ) {
		this.model = newModel;
		var promise = new Promise((resolve, reject) => {  
			if ( this.isValid() ) {
				Socket.emit('getDB', { dispositivos: this.lista });
			}
			else {
				resolve( false );
			}
		});
		
		return promise;
	}
}

export class Dispositivos extends Component {
	constructor( props ) {
		super( props );
		this.state = props.route.root.state;
	}
	generateRow( item ) {
		return (
			<tr>
				<td> 
				<Link to={ 'Dispositivos/salidas/' + item.ip }> { item.note } </Link>
				</td>
				<td> { item.version } </td>
				<td> 
				<Link to= {'Dispositivo/' + item.ip } className='iconEdit'></Link>
				</td>
			</tr>
		);
	}
	render() {
		console.log("Render class Dispositivos")
		var rows = this.state.dispositivos.map( this.generateRow );
		
		return ( 
			<div>
				<HTML.Table class="dispositivos"> { rows } </HTML.Table>
				<Link to='Dispositivos/create/' className='button'>Nuevo</Link>
			</div>
		);
	}
};

export class DispositivoEdit extends Component {
	constructor( props ) {
		super(props);
		this.state = props.route.root.state;
		this.changed = this.changed.bind( this );
		this.onSubmit = this.onSubmit.bind( this );
	}
	componentDidMount() {
		let found = this.state.dispositivos.filter( ( v, k, _this ) => {
			return v.ip === this.props.params.ip;
		});
		this.setState({ dispositivo: found[0] });		
	}
	validIP() {
		var ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
		return ipPattern.test( this.state.dispositivo.ip );
	}
	changed( e ) {
		e.preventDefault();
		var dispositivo = this.state.dispositivo;
		
		dispositivo[e.target.name] = e.target.value;
		this.setState({ 
			dispositivo: dispositivo, 
			valid: this.validIP() 
		});
	}
	onSubmit( e ) {
    	e.preventDefault();
    	DispositivosModel.save( this.state.dispositivo ).then( (response) => {
    		console.log("response",response)

    	})
	}
	render() {
		if ( this.state.dispositivo ) {
			return ( 
				<form ref="DispositivoForm" id="DispositivoForm" onSubmit={this.onSubmit}>
					Descripción
					<input type="text" name="note" onChange={ this.changed } value={this.state.dispositivo.note} />
					IP
					<input type="text" className={'valid' + this.validIP() } name="ip" onChange={this.changed} value={this.state.dispositivo.ip} />
					<button type="submit" className="button">Guardar</button>
				</form>
			);
		}
		else return null;
	}
};