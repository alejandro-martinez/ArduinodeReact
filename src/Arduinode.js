/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router, Route, hashHistory } from 'react-router';
import * as HTML from './HTML';
import Dispositivos from './Dispositivos';
import Luces from './Luces';

var menu = [
  {
    "text": "Dispositivos",
    "url": "/#/Dispositivos"
  },
  {
    "text": "Luces encendidas",
    "url": "/#/Luces"
  },
  {
    "text": "Tareas programadas",
    "url": "/#/Tareas"
  }
];

class Home extends Component {
	render() { return ( <HTML.ListaLinks items={menu} /> ); }
};

class Arduinode extends Component {
	render() {
		return (
			<div className="Arduinode">
				<HTML.Header titulo="Home" />
				<div className="container">
					<Router history={hashHistory}>
				  		<Route path="/" component={ Home }/>
				    	<Route path="/Dispositivos" component={ Dispositivos }/>
				    	<Route path="/Luces" component={ Luces }/>    
					</Router>
				</div>
	  		</div>
		);
	}
}

export default Arduinode;