/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import {Tarea} from './Arduinode';

export class Tareas extends Component {
	constructor( props ) {
		super( props );
		
		this.generateRow = this.generateRow.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onNew = this.onNew.bind(this);
		
		this.state = { tareas: [], edit:false };
		this.Tarea = new Tarea();
		this.Tarea.get( true ).then(( data )=> {
			console.log(data)
			this.setState({ tareas: data });
		});
	}
	onNew() {
		this.state.tareas.push( Tarea.newModel() );
		this.Tarea.updateDB( this.state.tareas );
	}
	onUpdate() {
		this.Tarea.update( this.state.tareas );
	}
	generateRow( item ) {
		return ( 
			<HTML.EditContainer edit={this.state.edit}>
				<HTML.EditRow root={ this.root }
							   onUpdate={ this.onUpdate }
							   edit={ false }
							   inputKey='descripcion'
							   model={ item } />
				<td>								  
					<Link className="button" to={'Tareas/subtareas/' + item.id}>Horarios</Link>
					<Link className="button">Dispositivos</Link>
				</td>
			</HTML.EditContainer>
		);
	}
	render() {
		var rows = this.state.tareas.map( this.generateRow );
		
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
		this.showTimerPopup = this.showTimerPopup.bind( this );
		this.onTemporizacion = this.onTemporizacion.bind( this );
		var state = this.state;

		state.popupVisible = false;
		state.showTimerIcon = false;
		state.popupData = "";
		this.setState(state);
	}
	showTimerPopup(e) {
		console.log("Paso",e)
		this.setState({ popupVisible: true})
	}
	onTemporizacion(item, e) {
		console.log("item",e)
	}
	onNew() {

	}
	generateRow( item ) {
		console.log("RERENDER")
		
		var diasSemana = ['Domingo','Lunes', 'Martes', 'Miercoles',
					 'Jueves','Viernes','Sabado'];
		var meses = ['Enero', 'Febrero', 'Marzo', 'Abril',
					'Mayo', 'Junio', 'Julio','Agosto',
					'Septiembre','Octubre', 'Noviembre', 'Diciembre'];
		return ( 
			<HTML.Table class="subtareas">
				<tr className="col2">
					<td>Inicio: { item.diainicio + "/" + meses[item.mesinicio].substr(0,3) }</td>
					<td>Fin: { item.diafin + "/" + meses[item.mesfin].substr(0,3) }</td>
				</tr>
				<tr className="col3 titulos">
					<td>Inicio</td>
					<td className="middle">Duración</td>
					<td>Fin</td>
				</tr>
				<tr className="col3">
					<td>
						<span onClick={ this.showTimerPopup } className="iconReloj horainicio"></span>
						{ item.horainicio }
					</td>
					<td className="middle">
						<span onClick={ this.showTimerPopup } className="iconReloj duracion"></span>
						{ item.duracion }
					</td>
					<td>
						<span onClick={ this.showTimerPopup } className="iconReloj horafin"></span>
						{ item.horafin }
					</td>
					<td>
						<span className="iconPreferencias">
						</span>
					</td>
				</tr>
			</HTML.Table>
		);
	}
	onTemporizacion ( e ) {
		e.preventDefault();
		this.setState({ popupData: e.target.value == "" ? null : e.target.value });
	}
	render() {
		var This = this;
		var tarea = this.state.tareas.filter((t) => {
			return this.props.routeParams.id == t.id;
		});

		if ( tarea.length ) {
			var subtareas = tarea[0].subtareas.map( this.generateRow, this );
			return ( 
				<div>
					<HTML.Popup showTimerIcon={ this.state.showTimerIcon } 
								className="temporizacion" 
								root={ This }>
						<input type="time" 
							   onChange={ This.onTemporizacion } 
							   value={ This.state.popupData } />
					</HTML.Popup>
					{ subtareas }
					<button onClick={ this.onNew }>Nueva</button>
				</div>
			);
		}
		else {
			return null;
		}
	}
}