/*jshint esversion: 6 */
import React, { Component } from 'react';
import Socket from './Socket';
import { Link } from 'react-router';
import * as HTML from './HTML';

export class Dispositivos extends Component {
	constructor( props ) {
		super( props );
		this.root = props.route.root;
		this.generateRow = this.generateRow.bind( this );
		this.onUpdate = this.onUpdate.bind( this );
	}
	generateRow( item ) {
		return ( <HTML.EditRow root={ this.root }
							   onUpdate={ this.onUpdate } 
							   edit={ false } 
							   model={ item } /> );
	}
	onUpdate( model ) {
		this.root.state.dispositivos = this.root.state.dispositivos.map(( disp ) => {
			if ( disp.ip == model.ip ) {
				disp.note = model.note;
				disp.ip = model.ip;
			}
			return disp;
		});
	}
	render() {
		var rows = this.root.state.dispositivos.map( this.generateRow );
		
		return ( 
			<div>
				<HTML.Table class="dispositivos"> { rows } </HTML.Table>
				<Link to='Dispositivos/create/' className='button'>Nuevo</Link>
			</div>
		);
	}
};