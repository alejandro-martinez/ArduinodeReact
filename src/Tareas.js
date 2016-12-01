/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import { Tarea } from './Arduinode';
import { SelectDispositivos } from './Dispositivos';

export class Tareas extends Component {
	constructor( props ) {
		super( props );
		['generateRow','onNew','onSetActiva','onSetAccion','onRemove'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});
		props.route.root.setTitlePage("Tareas");
		props.route.root.setState({ dbActual: "Tarea"});
		this.state = { edit:false, changed: false };
		
		Socket.listen('DBTareasUpdated', ( db ) => {
    		props.route.root.setState({ tareas: db });
    	});

		this.Tarea = new Tarea();
		this.Tarea.get();
	}
	onSetActiva(tarea, e) {
		tarea.activa = (tarea.activa) ? 0 : 1;
		this.props.route.root.setState({edit: true});
	}
	onSetAccion(tarea, e) {
		tarea.accion = (tarea.accion) ? 0 : 1;
		this.props.route.root.setState({edit: true});
	}
	onNew() {
		var tareas = this.state.tareas;
		tareas.push( Tarea.newModel() );
		this.props.route.root.setState({ edit: true, tareas: tareas });
	}
	onRemove( tarea, e ) {
		var i = this.props.route.root.state.tareas.indexOf( tarea );
		this.setState({ tareas: this.props.route.root.state.tareas.splice(i , 1), edit: true});
	}
	generateRow( item ) {
		return ( 
			<HTML.EditContainer edit={this.state.edit || item.descripcion.length === 0}>
				<HTML.EditRow  root={ this.props.route.root }
							   inputKey='descripcion'
							   model={ item } />
				<td>								  
					<ul className="listIcons tareasIcons">
						<li><Link className={'iconLAMP' + item.accion} onClick={ this.onSetAccion.bind(this, item) }></Link></li>
						<li><Link className={'iconACTIVA' + item.activa } onClick={ this.onSetActiva.bind(this, item) }></Link></li>
						<li><Link className="iconReloj" to={'Tareas/subtareas/' + item.id}></Link></li>
						<li><Link to={'Tareas/' + item.id + '/dispositivos'}>&#9854;</Link></li>
						<li><Link className="iconDELETE" onClick={ this.onRemove.bind(this,item) }></Link></li>
					</ul>
				</td>
			</HTML.EditContainer>
		);
	}
	render() {
		var rows = this.props.route.root.state.tareas.map( this.generateRow );
		
		return ( 
			<div>
				<HTML.Table class="tareas"> { rows } </HTML.Table>
				<button onClick={ this.onNew }>Nueva</button>
			</div>
		);
	}
}

export class Subtareas extends Tareas {
	constructor( props ) {
		super( props );
		this.onNew = this.onNew.bind( this );
		this.onChange = this.onChange.bind(this);
	}
	onNew() {
		this.tarea[0].subtareas.push( Tarea.newSubtareaModel() );
		this.props.route.root.setState({edit: true});
	}
	componentDidMount(){
		this.props.route.root.setState({edit: false});
		this.props.route.root.setTitlePage("Horarios");
	}
	generateRow( item ) {
		var diasSemana = Utils.getDiasSemana();
		var meses = Utils.getMeses();
		return ( 
			<HTML.Table class="subtareas">
				<tr className="col2">
					<td>Inicio: <input type="date" 
						   onChange={ this.onChange.bind(this, item) } 
						   name="fechainicio" 
						   value={ item.fechainicio } />
					</td>
					<td>Fin: <input type="date"
						   name="fechafin" 
						   onChange={ this.onChange.bind(this, item) } 
						   value={ item.fechafin } /></td>
				</tr>
				<tr className="col3 titulos">
					<td>Inicio
						<input type="time"
						   name="horainicio" 
						   onChange={ this.onChange.bind(this, item) } 
						   value={ item.horainicio } />
					</td>
					<td className="middle">
						Duración
						<input type="time" 
						   name="duracion" 
						   onChange={ this.onChange.bind(this, item) } 
						   value={ item.duracion } />
					</td>
					<td>Fin
						<input type="time"
						   name="horafin" 
						   onChange={ this.onChange.bind(this, item) } 
						   value={ item.horafin } />
					</td>
				</tr>
			</HTML.Table>
		);
	}
	onChange ( item, e ) {
		item[e.target.name] = e.target.value;
		this.props.route.root.setState({edit: true});
	}
	render() {
		this.tarea = this.state.tareas.filter((t) => {
			return this.props.routeParams.id == t.id;
		});

		if ( this.tarea.length ) {
			var subtareas = this.tarea[0].subtareas.map( this.generateRow, this );
			return ( 
				<div> 
					<ul className="listIcons headerIcons">
						<li><a onClick={ this.onNew } className='iconMAS'></a></li>
						<li><a onClick={ this.onUpdate } className={'iconOK show' + this.state.changed}></a></li>
					</ul>						
					{ subtareas }
				</div>
			);
		}
		else {
			return null;
		}
	}
}

export class TareaDispositivos extends Tareas {
	constructor( props ) {
		super( props );
		this.root 			= props.route.root;
		['onRemove','onNew','onChange'].forEach((m)=>{
			this[m] = this[m].bind(this);
		});
	}
	onRemove( dispositivo, e ) {
		var i = this.tarea.dispositivos.indexOf( dispositivo );
		this.tarea.dispositivos.splice(i, 1);
		this.root.setState({edit: true});
	}
	generateRow( item ) {
		var descripcion = ( item.salidadescripcion )
						  ? item.salidadescripcion 
						  : "Salida " + item.nro;
		return ( 
			<tr className="col2">
				<td>{ item.descripcion + ' - ' + descripcion }</td>
				<td><a onClick={ this.onRemove.bind( this, item )} className="iconDELETE"></a></td>
			</tr>
		);
	}
	componentDidMount(){
		this.root.setState({edit: false});
	}
	onChange ( item, e ) {
		item[e.target.name] = e.target.value;
		this.root.setState({edit: true});
	}
	onNew( dispositivo, salida ) {
		var salidaParsed = salida.split("-"),
			newDispositivo = { 
				ip 				 : dispositivo.ip, 
				descripcion		 : dispositivo.descripcion,
				nro				 : salidaParsed[0],
				salidadescripcion: salidaParsed[1]
			};
		
		this.tarea.dispositivos.push( newDispositivo );		
		this.root.setState({edit: true});
	}
	render() {
		if ( this.state.tareas.length ) {
			var tarea = this.state.tareas.filter((t) => {
				return this.props.routeParams.id == t.id;
			});
			this.tarea = tarea[0];
			this.dispositivos = this.tarea.dispositivos.map( this.generateRow, this );
			return (
				<div>
					<HTML.Popup launchIcon="iconMAS" class="dispositivos" root={ this }>
						<SelectDispositivos added={ this.tarea.dispositivos } 
											onAdd={ this.onNew }
											root={ this.root } />
					</HTML.Popup>
					<HTML.Table> { this.dispositivos } </HTML.Table>
				</div>
			);
		}
		else {
			return null;
		}
	}
}