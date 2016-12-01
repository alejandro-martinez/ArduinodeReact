import React, { Component } from 'react';
import { Link } from 'react-router';
import Loading from 'react-loading';
import Socket from './Socket';
import { Dispositivo, Validator } from './Arduinode';

export class Header extends Component {
	constructor( props ) {
		super( props );
		this.onUpdate = this.onUpdate.bind( this );
		document.addEventListener("loadingEvent",( e ) => {
			this.setState({ loading: e.detail }) 
		});
		this.state = { loading: false };
	}
	refresh() {
		Socket.emit('getDispositivosDB');
	}
	onUpdate() {
		this.props.root.updateDB();
	}
	render() {
		return (
			<header>
				
				<div id="loading" className={ 'show' + this.state.loading }>
					<Loading type='cylon' color='#e3e3e3' />
				</div>
				
				<a onClick={() => window.history.back()} 
					   className='back iconHeader left'></a>
				
				<h1 onClick={ this.refresh }>{ this.props.root.state.page }</h1>
				
				<ul className="headerIcons">
					<li className={'show' + this.props.root.state.edit}>
						<a onClick={ this.onUpdate } className={'iconOK'}></a>
					</li>
					<li> <a href='/#/' className='menu iconHeader right'></a> </li>
				</ul>

			</header>
		);
	}
};

export class Popup extends Component {
	constructor( props ) {
		super( props );
		this.state = { visible: false };
		this.toggle = this.toggle.bind( this );
	}
	toggle() {
		if (this.state.visible && this.props.onLaunchPopup) {
			this.props.onLaunchPopup();
		}
		this.setState({ visible: !this.state.visible});
	}
	render( props ) {
		if ( this.state.visible ) {
			return (
				<div>
					<div className={ this.props.class + ' center popup show' + this.state.visible}>
					{
						this.props.children
					}
					<input type="button" onClick={ this.toggle } value="Aceptar" />
					</div>
				</div>
			);
		}
		else {
			return (
				<ul className="headerIcons">
					<li><a className={ this.props.launchIcon } onClick={ this.toggle }>
						<span className={'show' + (this.props.root.state.popupData != "00:00")}> 
							{ this.props.root.state.popupData } 
						</span>
					</a></li>
				</ul>
			);
		}
		
	}
}


export function EditContainer(props) {
	return ( <tr className={ 'editRow' +  props.edit }> { props.children } </tr> );
}

export class EditRow extends Component {
	constructor( props ) {
		super( props );
		this.typingTimer 		= null;
		this.doneTypingInterval = 2000,
		this.root 				= props.root;
		this.state 				= { model: props.model, edit: false };
		this.onChange 			= this.onChange.bind( this );
		this.onClick 			= this.onClick.bind( this );
		this.doneTyping 		= () => { this.setState({ edit: false }); }
	}
	onClick() {
		this.root.setState({ edit: true });
		this.setState({ edit: true });
	}
	onChange(e) {
		var model = this.state.model;
		clearTimeout( this.typingTimer );

		var validator = 'isValid' + this.props.inputKey.toUpperCase();

		if ( Validator[validator]( e.target.value ) ) {
			model[this.props.inputKey] =  e.target.value;
			this.typingTimer = setTimeout( this.doneTyping, this.doneTypingInterval );
			this.setState({ model: model });
		}
	}
	render() {
		let itemEdit; 
		if ( this.state.edit ) {
			itemEdit = <input type="text" 
						  	  onChange={ this.onChange } 
						  	  value={ this.state.model[this.props.inputKey] } />

		}
		else {
			itemEdit = <h4 onClick={ this.onClick }>{ this.state.model[this.props.inputKey] }</h4>;
		}
		return (
			<td className={ 'editRow' + this.state.edit}>
				<div> { itemEdit } </div>
			</td>
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
    return (<li> <Link to={item.url} className={'button'}>{ item.text }</Link> </li>);
  }
  render() {
    var items = this.props.items.map( this.generateItem );
    return ( <ul className="menuList"> {items} </ul> );
  }
};