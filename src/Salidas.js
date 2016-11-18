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

		<div className={'switchContainer temporizada' + ( this.props.on && this.props.model.temporizada !== null )}>
			<span> { Utils.min_a_horario( this.props.model.temporizada ) }</span>
			
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
		this.state = props.root.state;
	}
	onSwitch( salida ) {
		salida.temporizada = 0;

		if ( salida.estado === 0 ) {
			salida.estado = 1;
		}
		else {
			salida.temporizada = this.props.root.state.popupData;
			salida.estado = 0;
		}

		Socket.emit('switchSalida', salida );
	}
	render() {
		var rows = this.state.salidas.map( function( item ) {
			return (
				<tr>
					<td> 
						<h4>{ item.note }</h4>
					</td>
					<td className={ 'show' + (item.estado !== null) }>
						<Toggle model={ item } onSwitch={ this.onSwitch } on={ item.estado === 0 }/>
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
		this.state = { 
			salidas 	: props.salidas,
			popupVisible: false, 
			popupData	: ""
		};
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
					<input type="time" onChange={ this.onTemporizacion } value={ this.state.popupData } />
				</HTML.Popup>
				<HTML.Table class="salidas">
					<Luz root={ This }/>
				</HTML.Table>
			</div>
		);
	}
};

export class SalidasActivas extends Component {
	constructor( props ) {
		super( props );
	}
	render() {
		var salidasActivas = [];
		
		this.props.route.root.state.dispositivos.forEach(( disp ) => {
			disp.salidas.forEach( (salida) => {
				if (salida.estado === 0) {
					salidasActivas.push( salida );
				}
			})
		});

		return ( <SalidasTable salidas={ salidasActivas } /> );
	}
};

export class SalidasDispositivo extends Component {
	constructor( props ) {
		super( props );
	}
	render() {
		var disp = this.props.route.root.state.dispositivos.filter(( disp ) => {
			return disp.ip == this.props.params.ip;
		});
		return ( <SalidasTable salidas={ disp[0].salidas } /> );
	}
};

