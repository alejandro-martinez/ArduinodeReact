import React, { Component } from 'react';
import { Link } from 'react-router';
import Loading from 'react-loading';
import Socket from './Socket';
import { Dispositivo, Validator } from './Arduinode';

export class Header extends Component {
	constructor( props ) {
		super( props );
		document.addEventListener("loadingEvent",( e ) => {
			this.setState({ loading: e.detail }) 
		});
		this.state = { loading: false };
	}
	componentDidMount(){
		
	}
	refresh() {
		Socket.emit('getDispositivosDB');
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
				<a href='/#/' className='menu iconHeader right'></a>
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
						<span className={'show' + (this.props.root.state.popupData !=0)}> { this.props.root.state.popupData } </span>
					</a></li>
				</ul>
			);
		}
		
	}
}


export function EditContainer(props) {
	return (
		<tr className={ 'editRow' +  props.edit }>
			{ props.children }
		</tr>
	);
}

export class EditRow extends Component {
	constructor( props ) {
		super( props );
		this.root = props.root;
		var editMode = (props.edit || props.model.ip == '0.0.0.0');
		this.state = { edit: editMode, model: props.model };
		this.onChange = this.onChange.bind(this);
		this.onClick = this.onClick.bind(this);
	}
	onClick() {
		this.setState({ edit: !this.state.edit });
	}
	onChange(e) {
		var model = this.state.model;
		var validator = 'isValid' + this.props.inputKey.toUpperCase();
		if ( Validator[validator]( e.target.value ) ) {
			model[this.props.inputKey] =  e.target.value;
			console.log(validator,"valid")
			this.setState({ model: model });
		}
	}
	onUpdate(model) {
		this.setState({ edit: false });
		if ( this.props.onUpdate( model )) {
			this.root.updateDB();	
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
			<td className={ 'editRow' +  this.state.edit }>
				<div> 
					{ itemEdit } 
					<a className='iconOK' onClick={ this.onUpdate.bind(this, this.state.model) }></a>
				</div>
			</td>
		);
	}
};
export class Table extends Component {
	render() {
		return (<table className={this.props.class}>
					<tbody>
						{ this.props.children }
					</tbody>
				</table>
		);
	}
};

export class ListaLinks extends Component {
  generateItem( item ) {
    return (
    	<li>
    		<Link to={item.url} className={'button'}>{ item.text }</Link>
    	</li>);
  }
  render() {
    var items = this.props.items.map( this.generateItem );
    return ( <ul className="menuList"> {items} </ul> );
  }
};