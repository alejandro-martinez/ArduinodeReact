/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import { Dispositivos, DispositivoEdit } from './Dispositivos';
import { Salidas, SalidasActivas } from './Salidas';

var menu = [
  {
    "text": "Dispositivos",
    "url": "Dispositivos"
  },
  {
    "text": "Luces encendidas",
    "url": "SalidasON"
  },
  {
    "text": "Tareas programadas",
    "url": "Tareas"
  }
];

class Home extends Component {
	render() { 
		return ( <HTML.ListaLinks items={ menu } /> ); 
	}
};

class Arduinode extends Component {
	render() {
		return (
			<div className="Arduinode">
				
				<HTML.Header titulo="Home" />

				<div className="container" loading="{ this.state.loading }">
					<Router history={ hashHistory }>
						<Route path="/" component={ Home } />
						<Route path="Salidas/:ip" component={ Salidas } />
						<Route path="SalidasON" component={ SalidasActivas } />
				    	<Route path="Dispositivos" component={ Dispositivos } />
				    	<Route path="Dispositivo/:ip" component={ DispositivoEdit } />
					</Router>
				</div>
	  		</div>
		);
	}
}

export default Arduinode;