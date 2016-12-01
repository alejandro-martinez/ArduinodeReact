/*jshint esversion: 6 */
import React, { Component } from 'react';
import Socket from './Socket';
import { Link } from 'react-router';
import * as HTML from './HTML';
import { Dispositivo } from './Arduinode';

export class SelectSalida extends Component {
	constructor( props ) {
		super(props);
		this.onChange = this.onChange.bind( this );
	}
	onChange( e ) {
		this.props.onSelect( this.props.dispositivo, e.target.value );
	}
	generateRow( salida ) {
		var row = <option value={ salida.nro + "-" + salida.descripcion }>{ salida.descripcion }</option>;

		if ( this.props.added.length === 0) {
			return row;
		}

		var duplicated = this.props.added.filter((d)=>{
			return d.ip === this.props.dispositivo.ip && d.nro == salida.nro;
		});
		
		if ( duplicated.length ) return null;
		else return row;
	}
	render() {
		if ( this.props.dispositivo ) {
			
			var salidas = this.props.dispositivo.salidas.map( this.generateRow, this);

			if ( salidas ) {
				return (<select onChange={ this.onChange }>
					<option value="">Selecciona salida</option>
					{ salidas }
				</select>);
			}
		}
		return null;
	}
};


export class SelectDispositivos extends Component {
	constructor( props ) {
		super( props );
		this.onChange = this.onChange.bind( this );
		this.state = { selected: null};
	}
	onChange( e ) {
		var selected = this.props.root.state.dispositivos.filter((d)=>{
			return d.ip === e.target.value;
		});
		this.setState({ selected: selected[0] });
	}
	componentDidMount() {
		this.setState({ selected: this.props.root.state.dispositivos[0] });	
	}
	render() {
		var dispositivos = this.props.root.state.dispositivos.map( ( item ) => {
			return (<option value={ item.ip }>{ item.descripcion }</option>);
		});

		return (
			<div>
				<select onChange={ this.onChange }>
					<option value="">Selecciona dispositivo</option>
					{ dispositivos }
				</select>
				<SelectSalida root={ this.props.root }
							  onSelect={ this.props.onAdd }
							  added={ this.props.added } 
							  dispositivo={ this.state.selected }/>
			</div>
		);
	}
};

export class Dispositivos extends Component {
	constructor( props ) {
		super( props );
		this.root = props.route.root;
		this.root.setState({ 
			dbActual: "Dispositivo", 
			page: "Dispositivos",
			showAddIcon: true
		});
		this.onUpdate 	= this.onUpdate.bind( this );
		this.onAddNew 	= this.onAddNew.bind( this );
		this.state 		= { edit: false };
	}
	componentDidMount() {
		document.addEventListener("onAddNew", this.onAddNew);
	}
	componentWillUnmount() {
		document.removeEventListener("onAddNew", this.onAddNew);
	}
	generateRow( item ) {
		return ( 
				<HTML.EditContainer edit={this.state.edit}>
					<HTML.EditRow root={ this.root }
								   onUpdate={ this.onUpdate }
								   inputKey='descripcion'
								   model={ item } />
					<td>{ item.version }</td>
					<HTML.EditRow root={ this.root }
								   onUpdate={ this.onUpdate }
								   inputKey='ip'
								   model={ item } />
					<td>
						<ul className="listIcons">
							<li><Link to={'Dispositivos/salidas/' + item.ip}>&#9854;</Link></li>
							<li><a onClick={ this.onRemove.bind( this, item )} className="iconDELETE"></a></li>
						</ul>
					</td>
				</HTML.EditContainer>
		);
	}
	onUpdate( model ) {
		this.root.state.dispositivos = this.root.state.dispositivos.map(( disp ) => {
			
			if ( disp.ip == model.ip ) {
				disp.descripcion = model.descripcion;
				disp.ip = model.ip;
			}
			return disp;
		});
		return true;
	}
	onAddNew() {
		var dispositivos = this.root.state.dispositivos;
		dispositivos.push( Dispositivo.newModel() );
		this.root.setState({ dispositivos: dispositivos, edit: true });
	}
	onRemove(item, e) {
		var dispositivos = this.root.state.dispositivos;
		var i = dispositivos.indexOf( item );
		dispositivos.splice(i, 1);
		this.root.setState({ edit: true, dispositivos: dispositivos });
	}
	render() {
		var rows = this.root.state.dispositivos.map( this.generateRow, this );
		
		return (<HTML.Table class="dispositivos"> { rows } </HTML.Table>);
	}
};