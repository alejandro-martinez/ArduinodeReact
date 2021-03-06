/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
import { Tarea, Validator } from './Arduinode';
import { SelectsDispositivos } from './Dispositivos';

export class Tareas extends Component {
	constructor( props ) {
		super( props );
		['generateRow','onAddNew','onSetActiva','onSetAccion','onRemove'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});
		props.route.root.setState({ 
			updateDB: "Tarea", 
			broadcastDB: "Tareas",
			page: "Tareas",
			listenBroadcastUpdate: true,
			showAddIcon: true,
			showTimerIcon: false
		});
		this.state = { edit:false, changed: false };
		
		Socket.listen('DBTareasUpdated', ( db ) => {
			if ( !props.route.root.state.adminMode ) {
				props.route.root.setState({ tareas: db, listenBroadcastUpdate: false });
			}
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
			<HTML.EditContainer disabled={ !item.enEjecucion }>
				<HTML.EditRow  root={ this.props.route.root }
							   inputKey='descripcion'
							   model={ item } />
				<td>
					<ul className="listIcons">
						<li className="Dispositivos"><Link to={'Tareas/' + item.id + '/dispositivos'}>&#9854;</Link></li>
						<li className="Reloj"><Link to={'Tareas/subtareas/' + item.id}></Link></li>
						<li className="onlyAdmin Delete"><Link onClick={ this.onRemove.bind(this,item) }></Link></li>
						<li className={'onlyAdmin Activa' + item.activa }><Link onClick={ this.onSetActiva.bind(this, item) }></Link></li>
						<li className={'onlyAdmin Lamp' + item.accion}><Link onClick={ this.onSetAccion.bind(this, item) }></Link></li>
					</ul>
				</td>
			</HTML.EditContainer>
		);
	}
	render() {
		var rows = this.props.route.root.state.tareas.map( this.generateRow );
		return (<HTML.Table class="tareas salidas"> { rows } </HTML.Table>);
	}
}

export class Subtareas extends Tareas {
	constructor( props ) {
		super( props );
		props.route.root.setState({ 
			updateDB: "Tarea",
			page: "Subtareas",
			broadcastDB: "Tareas",
			listenBroadcastUpdate: true
		});
		['onRemove','onSetDiasEjecucion','onChange','onAddNew'].forEach((m)=>{
			this[m] = this[m].bind( this );
		});
		this.tarea = [];
		this.diasSemana = ['Domingo','Lunes', 'Martes', 'Miercoles', 'Jueves','Viernes','Sabado'];
	}
	getCurrentTarea() {
		this.tarea = this.props.route.root.state.tareas.filter((t) => {
			return this.props.routeParams.id == t.id;
		});
		return this.tarea[0];
	}

   // Control de checkbox de selección de dias de ejecución
	onSetDiasEjecucion( key, subtarea, event ) {
		if ( this.props.route.root.state.adminMode ) {
			var valid = true;

			key = String( key );

			var dias = subtarea.diasejecucion.split(","),
				idx = dias.indexOf( key );
			
			(idx > -1) ? dias.splice( idx, 1 ) : dias.push( key );
			
			subtarea.diasejecucion = dias.join(",");
			valid = ( subtarea.diasejecucion.length > 0);
			this.props.route.root.setState({ edit: valid, listenBroadcastUpdate: !valid });
		}
	}
	onAddNew() {
		this.newModel = Tarea.newSubtareaModel( this.getCurrentTarea().subtareas);
		this.getCurrentTarea().subtareas.push( this.newModel );
		this.props.route.root.setState({edit: true});
	}
	componentDidMount() {
		document.addEventListener("onAddNew", this.onAddNew);
		if (this.getCurrentTarea()) {
			this.getCurrentTarea();
			this.props.route.root.setState({edit: false, page: this.getCurrentTarea().descripcion});
		}
	}
	componentWillUnmount() {
		document.removeEventListener("onAddNew", this.onAddNew);
	}
	onRemove( subtarea, e ) {
		if (confirm("Seguro que deseas quitar la subtarea?")) {
			var i = this.getCurrentTarea().subtareas.indexOf( subtarea );
			this.getCurrentTarea().subtareas.splice(i, 1);
			this.props.route.root.setState({ edit: true, listenBroadcastUpdate: false });
		}
	}
	generateRow( item ) {
		
		if ( item ) {
			var diasSemana = Utils.getDiasSemana();

			var DiasSemana = diasSemana.map(( dia, key ) => {
				return ( 
					<label>	{ dia.slice(0, 2) }
						<input
							type="checkbox"
							value="{ key }"
							required
							checked={ item.diasejecucion.split(",").indexOf( String(key)) > -1 }
							onClick={ this.onSetDiasEjecucion.bind(this, key, item ) } 
						/>
					</label>
				);
			}, this);
			var meses = Utils.getMeses();
			return ( 
				<form onChange={this.validForm}>
				<HTML.Table class="subtareas" key={ item.id }>
					<tr className="col3">
						<td>Inicio: <input type="date" 
							   onChange={ this.onChange.bind(this, item) } 
							   name="fechainicio" 
							   required
							   disabled={ !this.props.route.root.state.adminMode }
							   value={ item.fechainicio } />
						</td>
						<td>Fin: <input type="date"
							   name="fechafin" 
							   required
							   disabled={ !this.props.route.root.state.adminMode }
							   onChange={ this.onChange.bind(this, item) } 
							   value={ item.fechafin } /></td>
						<td className="floatRight Delete onlyAdmin">
							<a onClick={ this.onRemove }></a>
						</td>
					</tr>
					<tr className="col3 titulos">
						<td>Inicio
							<input type="time"
							   name="horainicio"
							   required
							   disabled={ !this.props.route.root.state.adminMode }
							   onChange={ this.onChange.bind(this, item) } 
							   value={ item.horainicio } />
						</td>
						<td className={"middle show"+ (this.getCurrentTarea().accion === 0)}>
							Duración
							<input type="time"
							   name="duracion"
							   disabled={ !this.props.route.root.state.adminMode }
							   required={ this.getCurrentTarea().accion == 0}
							   onChange={ this.onChange.bind(this, item) } 
							   value={ item.duracion } />
						</td>
						<td className={"show"+ (this.getCurrentTarea().accion === 0)}>Fin
							<input type="time"
							   name="horafin"
							   disabled={ !this.props.route.root.state.adminMode }
							   onChange={ this.onChange.bind(this, item) } 
							   readOnly
							   value={ item.horafin } />
						</td>
					</tr>
					<tr>
						<td className="diasEjecucion">
							{ DiasSemana }
						</td>
					</tr>
				</HTML.Table>
				</form>
			);
		}
	}
	validForm( form ) {
		return (form.target.value.length >= 5);
	}
	onChange ( item, e ) {
		item[e.target.name] = e.target.value;
		if (this.getCurrentTarea().accion === 0) {
			item.horafin = Utils.sumarHoras( item.horainicio, item.duracion);
		}
		if ( item.diasejecucion.length > 0) {
			this.props.route.root.setState({ edit: true, listenBroadcastUpdate: false });
		}
	}
	render() {
		if (this.getCurrentTarea()) {
		
			// Ordena subtareas por fecha de inicio
			this.getCurrentTarea().subtareas.sort(function(a, b){ 
				if (b) {
					var f1 = a.fechainicio;
					var f2 = b.fechainicio;
					
					return parseInt(f1.slice(5,7) + f1.slice(8,10) ) - 
						   parseInt(f2.slice(5,7) + f2.slice(8,10) );

				}
			});

			var subtareas = this.getCurrentTarea().subtareas.map( this.generateRow, this );
			return ( <div> { subtareas } </div> );
		}
		return null;
		
	}
}

export class TareaDispositivos extends SelectsDispositivos {
	constructor( props ) {
		super( props, 'tareas');		
	}	
}