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
			page: "Configuracion",
			showAddIcon: false,
			showTimerIcon: false
		});
		this.items = [
		  {
		    "text": "Log sistema",
		    "url": "/Configuracion/log"
		  },
		  {
		    "text": "Ajustes servidor",
		    "url": "/Configuracion/ajustes"
		  }
		];
	}
	render() { return ( <HTML.ListaLinks root={ this.props.route.root } items={ this.items } /> ); }
}

export class Log extends Component {
	constructor( props ) {
		super( props );
		props.route.root.setState({ 
			page: "Log sistema",
			showAddIcon: false,
			showTimerIcon: false
		});
		this.state = { logFile: null };
		Socket.listen('logUpdated', ( data ) => {
			this.setState({'logFile': data});
		});
	}
	componentDidMount() {
		Socket.emit('getLog');
	}
	generateLine( text ) {
		return <p> { text }</p>;
	}
	render() { 
		if ( this.state.logFile !== null) {
			var lines = this.state.logFile.map( this.generateLine );

			return ( <div className="logContainer"> { lines }</div> ); 
		}
		return null;
	}
	
}

export class Ajustes extends Component {
	constructor( props ) {
		super( props );
		props.route.root.setState({ 
			page: "Ajustes servidor",
			showAddIcon: false,
			showTimerIcon: false
		});
	}
	render() { 
		return ( 
			<div className="ajustes">
				<HTML.EditContainer edit={ this.state.edit }>
					<HTML.EditRow edit={ false }
							 root={ this.props.route.root }
							 inputKey='claveApp'
							 model={ this.props.route.root.state.config.claveApp }>
					</HTML.EditRow>

					<HTML.EditRow edit={ false }
							 root={ this.props.route.root }
							 inputKey='socketTimeout'
							 model={ this.props.route.root.state.config.socketTimeout }>
					</HTML.EditRow>

					<HTML.EditRow edit={ false }
							 root={ this.props.route.root }
							 inputKey='tiempoEscaneoTareas'
							 model={ this.props.route.root.state.config.tiempoEscaneoTareas }>
					</HTML.EditRow>
				</HTML.EditContainer>
			</div>
		);
	}
	
}



