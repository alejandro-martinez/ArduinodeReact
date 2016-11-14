/*jshint esversion: 6 */
import React, { Component } from 'react';
import * as HTML from './HTML';
import Switch from 'react-toggle-switch';
import Socket from './Socket';

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
      <Switch model={ this.props.model } on={ this.props.on } onClick={ this.switch } />
    );
  }
}

class Luz extends Component {
	constructor( props ) {
		super( props );
		this.onSwitch = this.onSwitch.bind( this );
	}
	onSwitch( salida ) {
		salida.temporizada = 0;
		salida.estado = ( salida.estado === 0 ) ? 1 : 0;
		
		Socket.listen('switchBroadcast', function( estado ) {
			salida.estado = estado;
		})
		
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
						{ item.temporizada }
					</td>
					<td>
						<Toggle model={ item } onSwitch={ this.onSwitch } on={ item.estado == 0 } />
					</td>
				</tr>
			);
		}, this);		

    	return ( <div> {rows} </div> );
	}
};


function SalidasTable( props ) {
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
		this.state = { salidas: [] }
	}
	componentDidMount() {
		
		var This = this;

		Socket.listen('salidasActivas', function ( salida ) {
			This.setState({ salidas: This.state.salidas.concat(salida) });
		});

		Socket.emit('getSalidasActivas');
	}
	render() {
		return ( <SalidasTable salidas={ this.state.salidas } /> );
	}
};

export class Salidas extends Component {
	constructor( props ) {
		super( props );
		this.state = { salidas: [] }
	}
	componentDidMount() {
		
		var This = this;

		Socket.listen('salidas', function ( salidas ) {
			
			salidas.forEach( function( v, k, _this ) {
				_this[k].ip = This.props.params.ip;
			});

			This.setState({salidas: salidas});
		});

		Socket.emit('getSalidas', { ip: this.props.params.ip });
	}
	render() {
		return ( <SalidasTable salidas={ this.state.salidas } /> );
	}
};

