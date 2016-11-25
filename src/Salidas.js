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
		this.root = props.root;
		this.onSwitch 			 = this.onSwitch.bind( this );
		this.onUpdate 			 = this.onUpdate.bind( this );
		this.state = { edit: false };
	}
	onSwitch( salida ) {
		var tiempo = this.props.salidasState.popupData;
		salida.temporizada = 0;
		salida.estado = (salida.estado === 0) ? 1 : 0;
		salida.temporizada = (tiempo == "") ? 0 : tiempo;
		Socket.emit('switchSalida', salida );
	}
	onUpdate( model ) {
		console.log("Update",model)
		this.root.state.dispositivos.forEach(( disp ) => {
			disp.salidas.forEach( (salida, k, _this) => {
				if ( salida.nro == model.nro ) {
					_this[k].note = model.note;
				}
			})
		});
		this.root.updateDB();
	}
	render() {
		let showSwitch = ( this.props.item.estado !== null) && ( !this.state.edit);
		return (
			<HTML.EditContainer edit={this.state.edit}>
				<HTML.EditRow edit={ false }
						 root={ this.root }
						 inputKey='note'
						 model={ this.props.item }
						 onUpdate={ this.onUpdate }>
				</HTML.EditRow>
				<td className={ 'show' + showSwitch }>
					<Toggle model={ this.props.item } 
							onSwitch={ this.onSwitch } 
							on={ this.props.item.estado === 0 }
							switchClass={ this.props.switchClass }
					/>
				</td>
			</HTML.EditContainer>
		);
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
		var tableItems = [];

		var rows = this.props.salidas.map( function( item ) {
			
			let estaTemporizada = (item.temporizada !== null && item.temporizada !== "");

			tableItems.push(
				<Luz key={ item.nro.toString() } item={ item }
					 salidasState={ This.state } 
					 root={ This.root } 
					 switchClass= { ' temporizada' + estaTemporizada }
				/>
			);
		}, this);

		return (
			<div>
				<HTML.Popup launchIcon="iconReloj" className="temporizacion" root={ This }>
					<input type="time" onChange={ this.onTemporizacion } 
									   value={ this.root.state.popupData } />
				</HTML.Popup>
				<HTML.Table class="salidas">
					{ tableItems }					
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
	componentWillMount() {
		var disp = this.state.dispositivos.filter(( disp ) => {
			return disp.ip == this.props.params.ip;
		});

		this.setState({ salidas: disp[0].salidas });
	}
	render() {
		return ( <SalidasTable root={ this.root }
							   salidas={ this.state.salidas } /> );
	}
};

