/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router,Link, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Socket from './Socket';
import { Dispositivos, DispositivosModel, DispositivoEdit } from './Dispositivos';
import { SalidasDispositivo, SalidasActivas } from './Salidas';

var menu = [
  {
    "text": "Dispositivos",
    "url": "/Dispositivos"
  },
  {
    "text": "Luces encendidas",
    "url": "/Dispositivos/salidasOn"
  },
  {
    "text": "Tareas programadas",
    "url": "/Tareas"
  }
];

class Home extends Component {
	render() { 
		return ( <HTML.ListaLinks items={ menu } /> ); 
	}
};

class Arduinode extends Component {
	constructor( props ) {
		super( props );
		this.state = { dispositivos: [] };
	}
	componentWillMount() {
		let This = this;

		Socket.listen('DBUpdated', ( dispositivos ) => {
			This.setState({ dispositivos: dispositivos });
		});

		Socket.emit('getDB');
	}
	render() {
		
		const This = this;
		return (
			<div className="Arduinode">
				
				<HTML.Header titulo="Home" />

				<div className="container">
					<Router history={ hashHistory }>
						<Route path="/" component={ Home } />
						<Route root={This} path="Dispositivos" component={ Dispositivos } />
						<Route root={This} path="Dispositivos/salidasOn" component={ SalidasActivas } />
						<Route root={This} path="Dispositivo/:ip" component={ DispositivoEdit } />
						<Route root={This} path="Dispositivos/salidas/:ip" component={ SalidasDispositivo } />
					</Router>
				</div>
	  		</div>
		);
	}
}

export default Arduinode;