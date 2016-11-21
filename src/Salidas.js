/*jshint esversion: 6 */
import React, { Component } from 'react';
import * as HTML from './HTML';
import Switch from 'react-toggle-switch';
import Socket from './Socket';
import Utils from './Utils';
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
		<div className={ 'switchContainer' + this.props.switchClass }>
			<span> { this.props.model.temporizada } </span>
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
		salida.temporizada = 0;

		if ( salida.estado === 0 ) {
			salida.estado = 1;
		}
		else {
			salida.temporizada = this.props.salidasState.popupData;
			salida.estado = 0;
		}

		Socket.emit('switchSalida', salida );
	}
	render() {
		var rows = this.props.salidas.map( function( item ) {
			var estaTemporizada = (item.temporizada !== null && item.temporizada !== "");

			return (
				<tr>
					<td> 
						<h4>{ item.note }</h4>
					</td>
					<td className={ 'show' + (item.estado !== null) }>
						<Toggle model={ item } 
								onSwitch={ this.onSwitch } 
								on={ item.estado === 0 }
								switchClass={' temporizada' + estaTemporizada}
						/>
					</td>
				</tr>
			);
		}, this);		

    	return ( <div> {rows} </div> );
	}
};

class SalidasTable extends Component {
	constructor( props ) {
		super( props );
		this.root = props.root;
		this.state = { 
			popupVisible: false, 
			popupData	: ""
		}
		this.onTemporizacion = this.onTemporizacion.bind( this );
		this.onAceptar 		 = this.onAceptar.bind( this );
	}
	onTemporizacion ( e ) {
		e.preventDefault();
		this.setState({ popupData: e.target.value == "" ? null : e.target.value });
	}
	onAceptar() {
		this.setState({ popupVisible: false });
	}
	render() {
		const This = this;
		return (
			<div>
				<HTML.Popup className="temporizacion" root={ This }>
					<input type="time" onChange={ this.onTemporizacion } value={ this.root.state.popupData } />
				</HTML.Popup>
				<HTML.Table class="salidas">
					<Luz salidasState={ this.state } root={ this.root } salidas={this.props.salidas} />
				</HTML.Table>
			</div>
		);
	}
};

export class SalidasActivas extends Component {
	constructor( props ) {
		super( props );
		this.root = props.route.root;
		this.state = this.root.state;
	}
	render() {		
		var salidasActivas = [];
		this.props.route.root.state.dispositivos.forEach(( disp ) => {
			disp.salidas.forEach( (salida) => {
				if (salida.estado == 0) {
					salidasActivas.push( salida );
				}
			})
		});
		return ( <SalidasTable root={ this.root } salidas={ salidasActivas } /> );
	}
};

export class SalidasDispositivo extends Component {
	constructor( props ) {
		super( props );
		this.root = props.route.root;
		this.state = this.root.state;
	}
	render() {
		var disp = this.state.dispositivos.filter(( disp ) => {
			return disp.ip == this.props.params.ip;
		});
		return ( <SalidasTable root={ this.root } salidas={ disp[0].salidas } /> );
	}
};

