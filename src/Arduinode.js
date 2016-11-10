/*jshint esversion: 6 */
import React, { Component } from 'react';
import { Router, Route, hashHistory } from 'react-router'
import './Arduinode.css';

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

class Header extends Component {
	constructor( props ) {
		super( props );
		this.state = {titulo: "Home"};
	}
	render() {
		return (<header>
					<a onClick={() => window.history.back()} className="back iconHeader left"></a>
					<h1>{ this.state.titulo }</h1>
					<a href="/" className="menu iconHeader rigth"></a>
				</header>
		);
	}
};

class LinkButton extends Component {
	constructor( props ) {
		super( props );
	}
	render() {
		return (
	      <a className={ this.props.class } href={ this.props.url }>{ this.props.text }</a>
	    );
	}
};

class Menu extends Component {
  generateItem( item ) {
    return <li><LinkButton class={'button'} text={ item.text } url={  item.url } /></li>
  }
  render() {
    var items = this.props.items.map( this.generateItem );
    return (
      <ul className="menuList"> {items}  </ul>
    );
  }
};

class Home extends Component {
	render() {
		return (<Menu items={menu} />);
	}
};

class Dispositivos extends Component {
	render() {
		return (<div> <h1> TODO: Menu Dispositivos </h1> </div>);
	}
};


class Luces extends Component {
	render() {
		return (<div> <h1> TODO: Menu Luces </h1> </div>);
	}
};

class Arduinode extends Component {
  render() {
    return (

		<div className="Arduinode">
			<Header titulo="Home" />
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