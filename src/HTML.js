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
		Socket.emit('getDispositivosDB'); 
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
			<header>
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
		<tr className={ 'disabled' + props.disabled || false}> 
			{ props.children } 
		</tr> 
	);
}

export class EditRow extends Component {
	constructor( props ) {
		super( props );
		this.typingTimer 		= null;
		this.noChangesTimer		= null;
		this.doneTypingInterval = 15000,
		this.root 				= props.root;
		this.state 				= { model: props.model, edit: false };
		this.onChange 			= this.onChange.bind( this );
		this.onClick 			= this.onClick.bind( this );
		this.doneTyping 		= () => { this.setState({ edit: false }); }
	}
	onClick() {
		this.setState({ edit: true });
		this.noChangesTimer = setTimeout(()=>{
			if (this.state.edit) {
				this.setState({ edit: false });
			}
		},15000);
	}
	onChange(e) {
		var model = this.props.model;
		clearTimeout( this.typingTimer );
		clearTimeout( this.noChangesTimer );		

		var validator = 'isValid' + this.props.inputKey.toUpperCase();
		this.props.root.setState({ listenBroadcastUpdate: false, edit: true });
		if (!Validator.hasOwnProperty(validator) || Validator[validator]( e.target.value )) {
			model[this.props.inputKey] =  e.target.value;
			this.typingTimer = setTimeout( this.doneTyping, this.doneTypingInterval );
			this.setState({ model: model });
		}		
	}
	render() {
		let itemEdit; 
		if ( this.props.root.state.adminMode ) {
			itemEdit = <input type="text" 
						  	  onChange={ this.onChange } 
						  	  value={ this.state.model[this.props.inputKey] } />

		}
		else {
			itemEdit = <Link to={this.props.link}>{ this.state.model[this.props.inputKey] }</Link>;
		}
		return (
			<td><div> { itemEdit } </div></td>
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