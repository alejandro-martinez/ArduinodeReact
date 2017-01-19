import React, { Component } from 'react';
import { Link } from 'react-router';
import Socket from './Socket';
import { Dispositivo, Validator } from './Arduinode';
import Utils from './Utils';

export class Header extends Component {
	constructor( props ) {
		super( props );
		this.onAdminModeChange = this.onAdminModeChange.bind( this );
	}
	refresh() {
		if (!window.waitingBroadcast) Socket.emit('getDispositivosDB'); 
	}
	onAdminModeChange() {
		if ( this.props.root.state.adminMode ) {
			this.props.root.setState({ adminMode: false, listenBroadcastUpdate: true });
		}
		else if (this.props.root.state.config.claveApp) {
			var clave = prompt("Ingrese clave", "");
			if (clave && clave == this.props.root.state.config.claveApp) {
				this.props.root.setState({ adminMode: true });
			}
		}		
	}
	render() {
		var isAdmin = this.props.root.state.adminMode,
			adminClass = ( isAdmin ) ? 'Logout' : 'Login';

		return (
			<header className={ this.props.class }>
				<h1 onClick={ this.refresh }>{ this.props.root.state.page }</h1>
				
				<ul className="headerIcons">
					<li> <a onClick={this.onAdminModeChange} className={'icon' + adminClass}></a> </li>
					<li> <a href='/#/' className='menu iconHeader right'></a> </li>
				</ul>
			</header>
		);
	}
};

export function EditContainer( props ) {
	return ( 		
		<tr className={props.class}> { props.children } </tr> 
	);
}

export class EditRow extends Component {
	constructor( props ) {
		super( props );
		this.root 				= props.root;
		this.state 				= { model: props.model, edit: false };
		this.onClick 			= this.onClick.bind( this );
	}
	onClick(e) {
		if (this.root.state.adminMode) {
			var model = this.props.model;
			var validator = 'isValid' + this.props.inputKey.toUpperCase();
			var data = prompt("Modificar", model[this.props.inputKey]);

			if (!Validator.hasOwnProperty(validator) || Validator[validator]( data )) {
				if (data && data.length) {
					model[this.props.inputKey] = data;
					this.setState({ model: model });
					this.root.setState({ edit: true });
				}
			}
		}
	}
	render() {
		var link = this.props.link || 'javascript:void(0)';
		return (
			<td><Link to={link} onClick={this.onClick}>{ this.state.model[this.props.inputKey] }</Link></td>
		);
	}
};
export class Table extends Component {
	render() {
		return (<table className={this.props.class}>
					<tbody> { this.props.children } </tbody>
				</table>
		);
	}
};

export class ListaLinks extends Component {
	generateItem( item ) {
		var onClick = item.hasOwnProperty('onClick') ? item.onClick : null;
		return (
			<li className={item.text.substr(0,6)}> 
				<Link to={item.url} onClick={onClick} className={'button'}>{ item.text }</Link> 
			</li>
		);
	}
	render() {
		var items = this.props.items.map( this.generateItem );
		return ( <ul className={"menuList admin" + this.props.root.state.adminMode}> {items} </ul> );
	}
};