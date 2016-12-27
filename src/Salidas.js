/*jshint esversion: 6 */
import React, { Component } from 'react';
import * as HTML from './HTML';
import Switch from 'react-toggle-switch';
import Socket from './Socket';
import Utils from './Utils';
import { Dispositivos, DispositivosModel, DispositivoEdit } from './Dispositivos';

export class Toggle extends React.Component {
  constructor( props ) {
    super( props );
  }
  render() {
  	
  	let estaTemporizada = ((this.props.model.temporizada !== 0 
  						 && this.props.model.hasOwnProperty('temporizada')
  						 && this.props.model.temporizada != "00:00") && this.props.on);
    return (
		<div className={ 'switchContainer temporizada' + estaTemporizada}>
			<span> { Utils.min_a_horario(this.props.model.temporizada) } </span>
			<Switch model={ this.props.model } on={ this.props.on } 
					onClick={ this.props.onSwitch.bind(this, this.props.model) }>
			</Switch>
		</div>
    );
  }
}

class Persiana extends Component {
	constructor( props ) {
		super( props );
		this.root = props.root;
		this.onClick = this.onClick.bind( this );
		this.state = { edit: false };
	}
	onClick(salida, direction,e) {
		salida.estado = direction; 
		Socket.emit('switchSalida', salida );
	}
	render() {
		return (
			<HTML.EditContainer edit={ this.state.edit }>
				<HTML.EditRow edit={ false }
						 root={ this.root }
						 inputKey='descripcion'
						 model={ this.props.item }>
				</HTML.EditRow>
				<td className={ 'show' + this.props.online}>
					<ul className="controlPersianas">
						<li><a className="iconDOWN" onClick={this.onClick.bind(this,this.props.item,1)}></a></li>
						<li><a className="iconSTOP" onClick={this.onClick.bind(this,this.props.item,2)}></a></li>
						<li><a className="iconUP" onClick={this.onClick.bind(this,this.props.item,0)}></a></li>
					</ul>
				</td>
			</HTML.EditContainer>
		);
	}

}

class Luz extends Component {
	constructor( props ) {
		super( props );
		this.root = props.root;
		this.onSwitch = this.onSwitch.bind( this );
		this.state = { edit: false };
	}
	onSwitch( salida, e ) {
		var temporizacion = Utils.horario_a_min( this.root.state.temporizacion );
		
		// Si se seteó temporizacion
		if ( temporizacion != 0 ) {
			// Si la temporizacion es distinta a la temporizacion actual de la salida
			if (temporizacion != salida.temporizada) {
				salida.temporizada =  this.root.state.temporizacion;
				salida.estado = 0;	
				Socket.emit('switchSalida', salida );			
			}
		}
		else {
			salida.estado = (salida.estado === 0) ? 1 : 0;
			salida.temporizada = 0;
			Socket.emit('switchSalida', salida );
		}		
	}
	render() {
		let estaTemporizada = (this.props.item.temporizada !== 0 && this.props.item.temporizada != "00:00");
		
		return (
			<HTML.EditContainer edit={ this.state.edit }>
				<HTML.EditRow edit={ false }
						 root={ this.root }
						 inputKey='descripcion'
						 model={ this.props.item }>
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
		this.root.setState({ showTimerIcon: true});
		this.state = { visible: false }
	}
	render() {
		const This = this;
		var tableItems = [];

		var rows = this.props.salidas.map( function( item ) {
			
			let estaTemporizada = (item.temporizada !== 0 && item.temporizada != "00:00");

			var salida = null;
			var nro = ((item.nro != null) ? item.nro.toString() : 0 ) + Utils.randomID();
			if ( item.tipo == 'L' ) {
				salida = <Luz key={ nro } item={ item }
					 salidasState={ This.state } 
					 online={ this.props.online }
					 root={ This.root } 
					 switchClass= { ' temporizada' + estaTemporizada }
				/>;
			}
			else {
				salida = <Persiana key={ nro  } item={ item }
					 salidasState={ This.state } 
					 online={ this.props.online }
					 root={ This.root }
				/>
			}

			tableItems.push(salida);
		}, this);

		return (
			<div>
				<HTML.Table class="salidas">{ tableItems }</HTML.Table>
			</div>
		);
	}
};

export class SalidasActivas extends Component {
	constructor( props ) {
		super( props );
		this.props.route.root.setState({
			page: "Luces encendidas",
			showAddIcon: false
		});
	}
	alfabeticSort( a, b) {
		var prev = a.descripcion.toUpperCase();
		var current = b.descripcion.toUpperCase();
		return current < prev ?  1
	         : current > prev ? -1
	         : 0;
	}
	render() {		
		var salidasActivas = [];
		this.props.route.root.state.dispositivos.forEach(( disp ) => {
			disp.salidas.forEach( (salida) => {
				if (salida.estado == 0 && salida.tipo === 'L') {
					salidasActivas.push( salida );
				}
			});
		});
		salidasActivas.sort( this.alfabeticSort );
		return ( <SalidasTable online={ true } root={ this.props.route.root } salidas={ salidasActivas } /> );
	}
};

export class SalidasDispositivo extends Component {
	constructor( props ) {
		super( props );
	}
	componentDidMount() {
		var disp = this.props.route.root.getDispositivoByIP( this.props.params.ip );
		if (disp) {
			this.props.route.root.setState({ page: disp.descripcion, showAddIcon: false});
		}
	}
	render() {
		var disp = this.props.route.root.getDispositivoByIP( this.props.params.ip );
		
		if (disp) {
			return ( <SalidasTable root={ this.props.route.root }
								   online={ !disp.offline }
								   salidas={ disp.salidas } /> );
		}
		return null;
	}
};

