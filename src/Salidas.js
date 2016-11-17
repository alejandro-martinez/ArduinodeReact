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
		<div className={'switchContainer temporizada' + (this.props.model.temporizada != '00:00')}>
			<span> { Utils.min_a_horario(this.props.temporizada) }</span>
			
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
			salida.temporizada = this.state.temporizada;
			salida.estado = 0;
		}
				
		Socket.emit('switchSalida', salida );
	}
	render() {
		var rows = this.props.salidas.map( function( item ) {
			return (
				<tr>
					<td> 
						<h4>{ item.note }</h4>
					</td>
					<td className={ 'show' + (item.estado !== null) }>
						<Toggle model={ item } 
								temporizada={item.temporizada} 
								onSwitch={ this.onSwitch } 
								on={ item.estado == 0 } />
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
		this.temporizacion = "";
		this.state = { popupVisible: false, popupText: this.temporizacion};
		this.onTemporizacion = this.onTemporizacion.bind( this );
		this.onAceptar = this.onAceptar.bind( this );
	}
	onTemporizacion ( e ) {
		this.temporizacion = e.target.value;
		this.setState({ popupText: this.temporizacion });
	}
	onAceptar() {
		this.setState({ popupVisible: false });
	}
	render() {
		const This = this;

		return (
			<div>
				<HTML.Popup className="temporizacion" root={ This }>
					<input type="time" onChange={ this.onTemporizacion } value={ this.state.temporizacion } />
				</HTML.Popup>
				<HTML.Table class="salidas">
					<Luz salidas={ this.props.salidas } root={ This }/>
				</HTML.Table>
			</div>
		);
	}
};

export class SalidasActivas extends Component {
	constructor( props ) {
		super( props );
		this.state = props.route.root.state;
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
	render() {
		var disp = this.state.dispositivos.filter(( disp ) => {
			return disp.ip == this.props.params.ip;
		});
		return ( <SalidasTable salidas={ disp[0].salidas} /> );
	}
};

