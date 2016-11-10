
/*jshint esversion: 6 */

import React, { Component } from 'react';
import * as HTML from './HTML';

class ListaDispositivos extends Component {
	constructor( props ) {
		super(props);
	}
	generateRow( item ) {
		return (
			<tr>
				<td> 
					<a href={'Dispositivo/' + item.ip}> { item.note } </a>
				</td>
				<td> {item.version} </td>
				<td> 
					<a href={'Salidas/' + item.ip}> Salidas </a>
				</td>
			</tr>
		);
	}
	render() {
		var rows = this.props.dispositivos.map( this.generateRow );
		
    	return ( <div> {rows} </div> );
	}
};

class Dispositivos extends Component {
	constructor(props) {
		super(props);
		this.state = { dispositivos: [] }
	}
	componentDidMount() {
		var This = this;
		
		window.socket.on('dispositivos', function ( dispositivos ) {
			This.setState({ dispositivos: dispositivos });
		});
		
		window.socket.emit('getDispositivos');
	}
	render() {
		return ( 
			<div>
				<HTML.Table class="dispositivos">
					<ListaDispositivos dispositivos={ this.state.dispositivos } />
				</HTML.Table>
				<HTML.LinkButton text="Nuevo" url="Dispositivos/create" class="button" />
			</div>
		);
	}
};

export default Dispositivos;