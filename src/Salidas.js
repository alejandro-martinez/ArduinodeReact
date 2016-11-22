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
		this.onSwitch = this.onSwitch.bind( this );
		this.onChangeDescripcion = this.onChangeDescripcion.bind( this );
		this.onItemClick = this.onItemClick.bind( this );
		this.onUpdate = this.onUpdate.bind( this );
		this.state = { model: props.item, editMode: false};
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
	onItemClick() {
		this.setState({ editMode: !this.editMode });
	}
	onChangeDescripcion( e ) {
		var model = this.state.model;
		model.note = e.target.value;
		this.setState({ model: model });
	}
	onUpdate( e ) {
		this.root.state.dispositivos.forEach(( disp ) => {
			disp.salidas.forEach( (salida, k, _this) => {
				if ( salida.nro_salida == this.state.model.nro_salida ) {
					_this[k].note = this.state.model.note;
				}
			})
		});
		this.root.updateDB();
		this.setState({ editMode: false });
	}
	render() {
		let itemEdit; 

		if ( this.state.editMode ) {
			itemEdit = <input type="text" 
							  onChange={ this.onChangeDescripcion } 
							  value={ this.state.model.note } />

		}
		else {
			itemEdit = <h4 onClick={ this.onItemClick }>{ this.state.model.note }</h4>;
		}
		let showSwitch = ( this.state.model.estado !== null) && ( !this.state.editMode);
		return (
			<tr className={ 'editRow' + this.state.editMode }>
				<td> 
					{ itemEdit } 
				</td>
				<td className={'edit show' + this.state.editMode}>
					<a className='iconOK' onClick={ this.onUpdate }></a>
				</td>
				<td className={ 'show' + showSwitch }>
					<Toggle model={ this.state.model } 
							onSwitch={ this.onSwitch } 
							on={ this.state.model.estado === 0 }
							switchClass={ this.props.switchClass }
					/>
				</td>
			</tr>
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
				<Luz key={ item.nro_salida.toString() } item={ item }
					 salidasState={ This.state } 
					 root={ This.root } 
					 switchClass= { ' temporizada' + estaTemporizada }
				/>
			);
		}, this);

		return (
			<div>
				<HTML.Popup className="temporizacion" root={ This }>
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

