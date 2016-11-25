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
		var row = <option value={ salida.nro + "-" + salida.note }>{ salida.note }</option>;

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
				return (<select onChange={ this.onChange }>{ salidas }</select>);
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
	render() {
		var dispositivos = this.props.root.state.dispositivos.map( ( item ) => {
			return (<option value={ item.ip }>{ item.note }</option>);
		});

		return (
			<div>
				<select onChange={ this.onChange }>{ dispositivos }</select>
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
		this.onUpdate = this.onUpdate.bind( this );
		this.onNew = this.onNew.bind( this );
		this.state = { edit: false };
	}
	generateRow( item ) {
		return ( 
				<HTML.EditContainer edit={this.state.edit}>
					<HTML.EditRow root={ this.root }
								   onUpdate={ this.onUpdate }
								   edit={ false }
								   inputKey='note'
								   model={ item } />
					<HTML.EditRow root={ this.root }
								   onUpdate={ this.onUpdate }
								   edit={ false } 
								   inputKey='ip'
								   model={ item } />
					<td>								  
					<Link className="button" to={'Dispositivos/salidas/' + item.ip}>Salidas</Link>
					</td>
				</HTML.EditContainer>
		);
	}
	onUpdate( model ) {
		this.root.state.dispositivos = this.root.state.dispositivos.map(( disp ) => {
			
			if ( disp.ip == model.ip ) {
				disp.note = model.note;
				disp.ip = model.ip;
			}
			return disp;
		});
		return true;
	}
	onNew() {
		var dispositivos = this.root.state.dispositivos;
		dispositivos.push( Dispositivo.newModel() );
		this.root.setState({dispositivos: dispositivos});
	}
	render() {
		var rows = this.root.state.dispositivos.map( this.generateRow, this );
		
		return ( 
			<div>
				<HTML.Table class="dispositivos"> { rows } </HTML.Table>
				<button onClick={ this.onNew }>Nuevo</button>
			</div>
		);
	}
};