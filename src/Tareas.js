/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';
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
		this.onChange = this.onChange.bind(this);
	}
	onNew() {
		var subtareas = this.tarea[0].subtareas;
		subtareas.push( Tarea.newSubtareaModel() );		
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
		console.log("CAmbio",e.target.name,e.target.value)
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
				<div id="subtareas"> 
					<span className='iconHeader'> + </span>
					<span className={'iconHeader iconOK show' + this.state.changed}></span>
					{ subtareas }
				</div>
			);
		}
		else {
			return null;
		}
	}
}