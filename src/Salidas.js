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
  	
  	let estaTemporizada = ((this.props.model.temporizada !== 0 && this.props.model.temporizada != "00:00") && this.props.on);

    return (
		<div className={ 'switchContainer temporizada' + estaTemporizada}>
			<span> { Utils.min_a_horario(this.props.model.temporizada) } </span>
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
		salida.estado = (salida.estado === 0) ? 1 : 0;
		salida.temporizada = Utils.horario_a_min( this.props.salidasState.popupData );
		Socket.emit('switchSalida', salida );
	}
	onUpdate( model ) {
		
		this.root.state.dispositivos.forEach(( disp ) => {
			disp.salidas.forEach( (salida, k, _this) => {
				if ( salida.nro == model.nro ) {
					_this[k].descripcion = model.descripcion;
				}
			})
		});
		this.root.updateDB();
	}
	render() {
		let estaTemporizada = (this.props.item.temporizada !== 0 && this.props.item.temporizada != "00:00");
		
		return (
			<HTML.EditContainer edit={ this.state.edit }>
				<HTML.EditRow edit={ false }
						 root={ this.root }
						 inputKey='descripcion'
						 model={ this.props.item }
						 onUpdate={ this.onUpdate }>
				</HTML.EditRow>
				<td className={ 'show' + this.props.online}>
					<Toggle model={ this.props.item } 
							onSwitch={ this.onSwitch } 
							on={ this.props.item.estado === 0 }
							switchClass={ 'show' + this.props.show + ' temporizada' + estaTemporizada }
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
			popupData: "00:00"
		};
		['onTemporizacion','onAceptar'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});
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
			
			let estaTemporizada = (item.temporizada !== 0 && item.temporizada != "00:00");
			
			tableItems.push(
				<Luz key={ item.nro.toString() } item={ item }
					 salidasState={ This.state } 
					 online={ this.props.online }
					 root={ This.root } 
					 switchClass= { ' temporizada' + estaTemporizada }
				/>
			);
		}, this);

		return (
			<div>
				<HTML.Popup launchIcon="iconReloj" 
							class="temporizacion" 
							onLaunchPopup={ this.onLaunchPopup }
							root={ This }>
					<input type="time" onChange={ this.onTemporizacion } 
									   value={ this.state.popupData } />
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
				if (salida.estado == 0) salidasActivas.push( salida );				
			})
		});
		return ( <SalidasTable online={ true } root={ this.root } salidas={ salidasActivas } /> );
	}
};

export class SalidasDispositivo extends Component {
	constructor( props ) {
		super( props );
		this.root = props.route.root;
		this.state = this.root.state;
		this.disp = {};
	}
	componentWillMount() {
		this.disp = this.state.dispositivos.filter(( disp ) => {
			return disp.ip == this.props.params.ip;
		})[0];

		this.setState({ salidas: this.disp.salidas });
	}
	render() {
		return ( <SalidasTable root={ this.root }
							   online={ !this.disp.offline }
							   salidas={ this.state.salidas } /> );
	}
};

