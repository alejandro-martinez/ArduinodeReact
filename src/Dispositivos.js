/*jshint esversion: 6 */
import React, { Component } from 'react';

class Table extends Component {
	generateRow( item ) {
		return (
			<div>
				<td> { item.note } </td>
				<td> { item.offline } </td>
				<td> <a href="">Salidas</a> </td>
			</div>
		);
	}
	render() {
		var items = this.props.items.map( this.generateRow );

		return (<table className={this.props.class}>
					<tbody>
						<tr>{ items } </tr>
					</tbody>
				</table>
		);
	}
};

class Dispositivos extends Component {
	constructor() {
		super();
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
		return ( <Table class="dispositivosList" items={this.state.dispositivos} /> );
	}
};

export default Dispositivos;