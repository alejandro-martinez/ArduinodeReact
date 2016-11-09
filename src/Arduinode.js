/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router, Route, hashHistory } from 'react-router'
import './Arduinode.css';
import LucesEncendidas from './LucesEncendidas'
import Dispositivos from './Dispositivos'

class Arduinode extends Component {
  render() {
    return (
      <div className="Arduinode">
        <div className="Arduinode-header">
          <h1>Arduinode</h1>
          
          <Router history={hashHistory}>
		    <Route path="/dispositivos" component={Dispositivos}/>
		    <Route path="/lucesEncendidas" component={LucesEncendidas}/>    
		  </Router>

        </div>
      </div>
    );
  }
}

export default Arduinode;