/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import { Zona, Validator } from './Arduinode';
import { SelectsDispositivos } from './Dispositivos'
import { Toggle } from './Salidas';

export class Zonas extends Component {
	constructor( props ) {
		super(props);
		['generateRow','onAddNew','onSwitch','onRemove'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});
		props.route.root.setState({ 
			dbActual: "Zona", 
			page: "Zonas",
			showAddIcon: true,
			showTimerIcon: false
		});
		this.state = { edit: false };
	}
	onSwitch(zona, e) {
		console.log("zona",zona,e)
		this.props.route.root.setState({edit: true});
	}
	onAddNew() {
		var zonas = this.props.route.root.state.zonas;
		this.newModel = Zona.newModel();
		zonas.push( this.newModel );
		this.props.route.root.setState({ edit: true, zonas: zonas });
	}
	onRemove( zona, e ) {
		if (confirm("Seguro que deseas eliminar la zona?")) {
			var i = this.props.route.root.state.zonas.indexOf( zona );
			this.setState({ zonas: this.props.route.root.state.zonas.splice(i , 1)});
			this.props.route.root.setState({ edit: true});
		}		
	}
	componentDidMount() {
		document.addEventListener("onAddNew", this.onAddNew);
	}
	componentWillUnmount() {
		document.removeEventListener("onAddNew", this.onAddNew);
	}
	generateRow( item ) {
		return ( 
			<HTML.EditContainer edit={ this.state.edit || item.descripcion.length === 0 }>
				<HTML.EditRow  root={ this.props.route.root }
							   inputKey='descripcion'
							   model={ item } />
				<td className="icons">								  
					<ul className="zonasIcons">
						<li className="iconDispositivos"><Link to={'Zonas/' + item.id + '/dispositivos'}>&#9854;</Link></li>
						<li><Link className="iconDELETE" onClick={ this.onRemove.bind(this,item) }></Link></li>
						<li>
							<Toggle model={ item } 
									onSwitch={ this.onSwitch } 
									on={true}
									switchClass='showtrue temporizadafalse'
							/>
						</li>						
					</ul>
				</td>
			</HTML.EditContainer>
		);
	}
	render() {
		var rows = this.props.route.root.state.zonas.map( this.generateRow );
		return (<HTML.Table class={"zonas admin" + this.props.route.root.state.adminMode}> { rows } </HTML.Table>);
	}
}

export class ZonasDispositivos extends SelectsDispositivos {
	constructor( props ) {
		super( props, 'zonas');		
	}	
}