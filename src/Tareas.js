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
		
		this.generateRow= this.generateRow.bind(this);
		this.onUpdate 	= this.onUpdate.bind(this);
		this.onNew 		= this.onNew.bind(this);
		this.onSetActiva = this.onSetActiva.bind(this);
		this.onSetAccion = this.onSetAccion.bind(this);
		this.state = { tareas: [], edit:false };
		this.Tarea = new Tarea();

		this.Tarea.get( true ).then(( data )=> {
			console.log("TAREAS", data)
			this.setState({ tareas: data });
		});
	}
	onSetActiva(tarea, e) {
		tarea.activa = (tarea.activa) ? 0 : 1;
		this.setState({ changed: true });
	}
	onSetAccion(tarea, e) {
		tarea.accion = (tarea.accion) ? 0 : 1;
		this.setState({ changed: true });
	}
	onNew() {
		var tareas = this.state.tareas;
		tareas.push( Tarea.newModel() );
		this.setState({ tareas: tareas });
	}
	onUpdate() {
		this.Tarea.update( this.state.tareas );
		this.setState({ changed: false });
	}
	componentDidMount(){
		this.setState({ changed: false });
	}
	generateRow( item ) {
		return ( 
			<HTML.EditContainer edit={this.state.edit || item.descripcion.length === 0}>
				<HTML.EditRow root={ this.root }
							   onUpdate={ this.onUpdate }
							   edit={ false }
							   inputKey='descripcion'
							   model={ item } />
				<td>								  
					<ul className="listIcons tareasIcons">
						<li><Link className={'iconLAMP' + item.accion} onClick={ this.onSetAccion.bind(this, item) }></Link></li>
						<li><Link className={'iconACTIVA' + item.activa } onClick={ this.onSetActiva.bind(this, item) }></Link></li>
						<li><Link className="iconReloj" to={'Tareas/subtareas/' + item.id}></Link></li>
						<li><Link to={'Tareas/' + item.id + '/dispositivos'}>&#9854;</Link></li>
					</ul>
				</td>
			</HTML.EditContainer>
		);
	}
	render() {
		var rows = this.state.tareas.map( this.generateRow );
		
		return ( 
			<div>
				<ul className="listIcons headerIcons">
					<li><a onClick={ this.onUpdate } className={'iconOK show' + this.state.changed}></a></li>
				</ul>
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
		this.forceUpdate();
	}
	componentDidMount(){
		this.setState({ changed: false });
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
		this.setState({ changed: true });
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
						<li><a onClick={ this.onUpdate } className={'iconHeader iconOK show' + this.state.changed}></a></li>
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
		this.onRemove 		= this.onRemove.bind(this);
		this.onNew 			= this.onNew.bind( this );
		this.onChange 		= this.onChange.bind(this);
	}
	onRemove( item, e ) {
		console.log("REMove",item)
		var i = this.tarea.dispositivos.indexOf( item );
		this.tarea.dispositivos.splice(i, 1);
		this.setState({ changed: true });
	}
	generateRow( item ) {
		return ( 
			<tr className="col2">
				<td>{ item.descripcion + ' - ' + item.salidadescripcion }</td>
				<td><a onClick={ this.onRemove.bind( this, item )} class="iconDELETE">X</a></td>
			</tr>
		);
	}
	componentDidMount(){
		this.setState({ changed: false  });
	}
	onChange ( item, e ) {
		item[e.target.name] = e.target.value;
		this.setState({ changed: true });
	}
	onNew( dispositivo, salida ) {
		var salidaParsed = salida.split("-"),
			newDispositivo = { 
				ip: dispositivo.ip, 
				descripcion: dispositivo.descripcion,
				nro: salidaParsed[0],
				salidadescripcion: salidaParsed[1] 
			};
		
		this.tarea.dispositivos.push( newDispositivo );		
		this.setState({ changed:true });
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
					<ul className="listIcons headerIcons">
						<li><a onClick={ this.onUpdate } className={'iconOK show' + this.state.changed}></a></li>
					</ul>
					<HTML.Popup launchIcon="iconMAS" class="dispositivos" root={ this }>
						<SelectDispositivos added={ this.tarea.dispositivos } 
											onAdd={ this.onNew }
											root={ this.root } />
					</HTML.Popup>
					<HTML.Table> 
						{ this.dispositivos }
					</HTML.Table>
				</div>
			);
		}
		else {
			return null;
		}
	}
}