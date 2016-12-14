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
	render() { return ( <HTML.ListaLinks items={ this.items } /> ); }
	
}
