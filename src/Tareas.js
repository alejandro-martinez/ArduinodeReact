/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import { Tarea, Validator } from './Arduinode';
import { SelectDispositivos } from './Dispositivos';

export class Tareas extends Component {
	constructor( props ) {
		super( props );
		['generateRow','onAddNew','onSetActiva','onSetAccion','onRemove'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});
		props.route.root.setState({ 
			dbActual: "Tarea", 
			page: "Tareas",
			showAddIcon: true,
			showTimerIcon: false
		});
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
	onAddNew() {
		var tareas = this.props.route.root.state.tareas;
		this.newModel = Tarea.newModel();
		tareas.push( this.newModel );
		this.props.route.root.setState({ edit: true, tareas: tareas });
	}
	onRemove( tarea, e ) {
		if (confirm("Seguro que deseas eliminar la tarea?")) {
			var i = this.props.route.root.state.tareas.indexOf( tarea );
			this.setState({ tareas: this.props.route.root.state.tareas.splice(i , 1)});
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
			<HTML.EditContainer edit={this.state.edit || item.descripcion.length === 0}>
				<HTML.EditRow  root={ this.props.route.root }
							   inputKey='descripcion'
							   model={ item } />
				<tr className="icons">
					<td>								  
					<ul className="listIcons tareasIcons">
						<li><Link className={'iconLAMP' + item.accion} onClick={ this.onSetAccion.bind(this, item) }></Link></li>
						<li><Link className={'iconACTIVA' + item.activa } onClick={ this.onSetActiva.bind(this, item) }></Link></li>
						<li><Link className="iconDELETE" onClick={ this.onRemove.bind(this,item) }></Link></li>
						<li className="iconReloj"><Link to={'Tareas/subtareas/' + item.id}></Link></li>
						<li><Link to={'Tareas/' + item.id + '/dispositivos'}>&#9854;</Link></li>
					</ul>
					</td>
				</tr>
			</HTML.EditContainer>
		);
	}
	render() {
		var rows = this.props.route.root.state.tareas.map( this.generateRow );
		return (<HTML.Table class={"tareas admin" + this.props.route.root.state.adminMode}> { rows } </HTML.Table>);
	}
}

export class Subtareas extends Tareas {
	constructor( props ) {
		super( props );
		this.onAddNew = this.onAddNew.bind( this );
		this.onChange = this.onChange.bind(this);
	}
	getCurrentTarea() {
		this.tarea = this.props.route.root.state.tareas.filter((t) => {
			return this.props.routeParams.id == t.id;
		});
		return this.tarea[0];
	}
	onAddNew() {
		this.newModel = Tarea.newSubtareaModel( this.getCurrentTarea().subtareas);
		this.getCurrentTarea().subtareas.push( this.newModel );
		this.props.route.root.setState({edit: true});
	}
	componentDidMount() {
		document.addEventListener("onAddNew", this.onAddNew);
		this.getCurrentTarea();
		this.props.route.root.setState({edit: false, page: "Horarios"});
	}
	componentWillUnmount() {
		document.removeEventListener("onAddNew", this.onAddNew);
	}
	generateRow( item ) {
		
		var diasSemana = Utils.getDiasSemana();
		var meses = Utils.getMeses();
		return ( 
			<form>
			<HTML.Table class="subtareas" key={ item.id }>
				<tr className="col2">
					<td>Inicio: <input type="date" 
						   onChange={ this.onChange.bind(this, item) } 
						   name="fechainicio" 
						   required
						   value={ item.fechainicio } />
					</td>
					<td>Fin: <input type="date"
						   name="fechafin" 
						   required
						   onChange={ this.onChange.bind(this, item) } 
						   value={ item.fechafin } /></td>
				</tr>
				<tr className="col3 titulos">
					<td>Inicio
						<input type="time"
						   name="horainicio"
						   required
						   onChange={ this.onChange.bind(this, item) } 
						   value={ item.horainicio } />
					</td>
					<td className={"middle show"+ (this.getCurrentTarea().accion === 0)}>
						Duración
						<input type="time"
						   name="duracion"
						   onChange={ this.onChange.bind(this, item) } 
						   value={ item.duracion } />
					</td>
					<td className={"show"+ (this.getCurrentTarea().accion === 0)}>Fin
						<input type="time"
						   name="horafin"
						   onChange={ this.onChange.bind(this, item) } 
						   readOnly
						   value={ item.horafin } />
					</td>
				</tr>
			</HTML.Table>
			</form>
		);
	}
	onChange ( item, e ) {
		item[e.target.name] = e.target.value;
		if (this.getCurrentTarea().accion === 0) {
			console.log( Utils.sumarHoras( item.horainicio, item.duracion))
			item.horafin = Utils.sumarHoras( item.horainicio, item.duracion);
		}
		
		this.props.route.root.setState({ edit: true });
	}
	render() {

		if (!this.tarea ) return null;

		// Ordena subtareas por fecha de inicio
		this.tarea[0].subtareas.sort(function(a, b){ 
			if (b) {
				var f1 = a.fechainicio;
				var f2 = b.fechainicio;
				
				return parseInt(f1.slice(5,7) + f1.slice(8,10) ) - 
					   parseInt(f2.slice(5,7) + f2.slice(8,10) );

			}
		});

		var subtareas = this.tarea[0].subtareas.map( this.generateRow, this );

		return ( <div> { subtareas } </div> );		
	}
}

export class TareaDispositivos extends Tareas {
	constructor( props ) {
		super( props );
		this.root = props.route.root;
		['onRemove','onHidePopup', 'onAddNew','onChange'].forEach((m)=>{
			this[m] = this[m].bind(this);
		});
		this.state = { edit: false };
	}
	onRemove( dispositivo, e ) {
		if (confirm("Seguro que deseas quitar " + dispositivo.descripcion + "?")) {
			var i = this.tarea.dispositivos.indexOf( dispositivo );
			this.tarea.dispositivos.splice(i, 1);
			this.root.setState({edit: true});
		}
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
	componentDidMount() {
		document.addEventListener("onAddNew", this.onAddNew);
	}
	componentWillUnmount() {
		document.removeEventListener("onAddNew", this.onAddNew);
	}
	onChange ( item, e ) {
		item[e.target.name] = e.target.value;
		this.root.setState({ edit: true });
	}
	onHidePopup() {
		this.setState({ edit: false });	
	}
	onAddNew( dispositivo, salida ) {
		if ( dispositivo && salida ) { 
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
		else {
			this.setState({ edit: true });
		}
	}
	render() {
		if ( this.root.state.tareas.length ) {
			var tarea = this.root.state.tareas.filter((t) => {
				return this.props.routeParams.id == t.id;
			});
			this.tarea = tarea[0];
			this.dispositivos = this.tarea.dispositivos.map( this.generateRow, this );
			return (
				<div>
					<div>
						<div className={'dispositivos center popup show' + this.state.edit}>
						<SelectDispositivos added={ this.tarea.dispositivos } 
											onAdd={ this.onAddNew }
											root={ this.root } />
						<input type="button" onClick={ this.onHidePopup } value="Aceptar" />
						</div>
					</div>
					
					<HTML.Table class="tareaDispositivos"> { this.dispositivos } </HTML.Table>
				</div>
			);
		}
		else {
			return null;
		}
	}
}