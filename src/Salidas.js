/*jshint esversion: 6 */
import React, { Component } from 'react';
import * as HTML from './HTML';
import Switch from 'react-toggle-switch';
import Socket from './Socket';
import { Dispositivos, DispositivosModel, DispositivoEdit } from './Dispositivos';

class Toggle extends React.Component {
  constructor( props ) {
    super( props );
    this.switch = this.switch.bind( this );
  }
  switch() {
  	this.props.on = !this.props.on;
  	
  	// Accion asociada al switch, se implementa en el componente que haga uso de Toggle
  	this.props.onSwitch( this.props.model );
  }

  render() {
    return (
		<div className={'switchContainer temporizada' + (this.props.model.temporizada != 0)}>
			<span> { this.props.temporizada + ' min'}</span>
			
			<Switch model={ this.props.model } on={ this.props.on } 
					onClick={ this.switch }>
			</Switch>
		</div>
    );
  }
}

class Luz extends Component {
	constructor( props ) {
		super( props );
		this.onSwitch = this.onSwitch.bind( this );
	}
	onSwitch( salida ) {
		salida.temporizada = 60;
		salida.estado = ( salida.estado === 0 ) ? 1 : 0;
				
		Socket.emit('switchSalida', salida );
	}
	render() {
		var rows = this.props.salidas.map( function( item ) {
			return (
				<tr>
					<td> 
						<h4>{ item.note }</h4>
					</td>
					<td>
						<Toggle model={ item } temporizada={item.temporizada} onSwitch={ this.onSwitch } on={ item.estado == 0 } />
					</td>
				</tr>
			);
		}, this);		

    	return ( <div> {rows} </div> );
	}
};


function SalidasTable( props ) {
	console.log("PROPS",props.salidas)
	return ( 
		<div>
			<HTML.Table class="salidas">
				<Luz salidas={ props.salidas } />
			</HTML.Table>
		</div>
	);
};

export class SalidasActivas extends Component {
	constructor( props ) {
		super( props );
		this.state = props.route.root.state;
	}
	componentWillMount() {
		Socket.emit('getDB');
	}
	render() {
		var salidasActivas = [];
		this.state.dispositivos.forEach(( disp ) => {
			disp.salidas.forEach( (salida) => {
				if (salida.estado === 0) {
					salidasActivas.concat(salida);
				}
			})
		});
		return ( <SalidasTable salidas={ salidasActivas } /> );
	}
};

export class SalidasDispositivo extends Component {
	constructor( props ) {
		super( props );
		this.state = props.route.root.state;
	}
	componentDidMount() {
		Socket.emit('getDB');
	}
	render() {
		var disp = this.state.dispositivos.filter(( disp ) => {
			return disp.ip == this.props.params.ip;
		});
		return ( <SalidasTable salidas={ disp[0].salidas} /> );
	}
};

