/*jshint esversion: 6 */
import React, { Component } from 'react';
import Socket from './Socket';
import { Link } from 'react-router';
import * as HTML from './HTML';

export class Dispositivo {
	constructor() {
		this.errors = null;
		var model = { 
			ip: "0.0.0.0", 
			note: "Nuevo dispositivo",
			salidas: []
		};

		return model;
	}
	static isValidNOTE() {
		return true;
	}
	static isValidIP( ip ) {		
		return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip));
	}
}

export class Dispositivos extends Component {
	constructor( props ) {
		super( props );
		this.root = props.route.root;
		this.generateRow = this.generateRow.bind( this );
		this.onUpdate = this.onUpdate.bind( this );
		this.onNew = this.onNew.bind( this );
		this.state = { edit: false };
	}
	generateRow( item ) {
		return ( 
				<HTML.EditContainer edit={this.state.edit}>
					<HTML.EditRow root={ this.root }
								   onUpdate={ this.onUpdate }
								   edit={ false }
								   inputKey='note'
								   model={ item } />
					<HTML.EditRow root={ this.root }
								   onUpdate={ this.onUpdate }
								   edit={ false } 
								   inputKey='ip'
								   model={ item } />
					<td>								  
					<Link className="button" to={'Dispositivos/salidas/' + item.ip}>Salidas</Link>
					</td>
				</HTML.EditContainer>
		);
	}
	onUpdate( model ) {
		this.root.state.dispositivos = this.root.state.dispositivos.map(( disp ) => {
			
			if ( disp.ip == model.ip ) {
				disp.note = model.note;
				disp.ip = model.ip;
			}
			return disp;
		});
		return true;
	}
	onNew() {
		var dispositivos = this.root.state.dispositivos;
		dispositivos.push( new Dispositivo() );
		this.root.setState({dispositivos: dispositivos});
	}
	render() {
		var rows = this.root.state.dispositivos.map( this.generateRow );
		
		return ( 
			<div>
				<HTML.Table class="dispositivos"> { rows } </HTML.Table>
				<button onClick={ this.onNew }>Nuevo</button>
			</div>
		);
	}
};