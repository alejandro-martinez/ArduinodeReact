/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import Utils from './Utils';

export class Configuracion extends Component {
	constructor( props ) {
		super( props );
		props.route.root.setState({ 
			page: "Configuración",
			showAddIcon: false,
			showTimerIcon: false
		});
		this.items = [
		  {
		    "text": "Ajustes servidor",
		    "url": "/Configuracion/ajustes"
		  }
		];
	}
	render() { return ( <HTML.ListaLinks root={ this.props.route.root } items={ this.items } /> ); }
}

export class Ajustes extends Component {
	constructor( props ) {
		super( props );
		props.route.root.setState({ 
			dbActual: "config",
			page: "Ajustes servidor",
			showAddIcon: false,
			showTimerIcon: false
		});
		this.state = { edit: false };
	}
	render() { 
		
		if ( this.props.route.root.state.config ) {
			return ( 
				<div className={"ajustes show" + this.props.route.root.adminMode}>
					<HTML.EditContainer edit={ this.state.edit }>
						<label> Clave App 
							<HTML.EditRow edit={ this.state.edit }
									 root={ this.props.route.root }
									 inputKey='claveApp'
									 model={ this.props.route.root.state.config }>
							</HTML.EditRow>
						</label>
						<label> Timeout de conexión con dispositivos Arduino (ms)
							<HTML.EditRow edit={ this.state.edit }
									 root={ this.props.route.root }
									 inputKey='socketTimeout'
									 model={ this.props.route.root.state.config }>
							</HTML.EditRow>
						</label>
						<label> Timeout de broadcast a clientes conectados (s)
							<HTML.EditRow edit={ this.state.edit }
									 root={ this.props.route.root }
									 inputKey='broadcastTimeout'
									 model={ this.props.route.root.state.config }>
							</HTML.EditRow>
						</label>
						<label> Retardo inicial de carga de tareas (min)
							<HTML.EditRow edit={ this.state.edit }
									 root={ this.props.route.root }
									 inputKey='retardoCargaDeTareas'
									 model={ this.props.route.root.state.config }>
							</HTML.EditRow>
						</label>
						<label> Intervalo de escaneo de tareas (min)
							<HTML.EditRow edit={ this.state.edit }
									 root={ this.props.route.root }
									 inputKey='intervaloEscaneoTareas'
									 model={ this.props.route.root.state.config }>
							</HTML.EditRow>
						</label>
					</HTML.EditContainer>
				</div>
			);
		}
		return null;
	}	
}



