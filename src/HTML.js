import React, { Component } from 'react';
import { Link } from 'react-router';
import Loading from 'react-loading';

export class Header extends Component {
	constructor( props ) {
		super( props );
		this.state = { titulo: 'Home', loading: false };
		document.addEventListener("loadingEvent",( e ) => {
			this.setState({ loading: e.detail }) 
		});
	}
	render() {
		return (
			<header>
				
				<div id="loading" className={ 'show' + this.state.loading }>
					<Loading type='cylon' color='#e3e3e3' />
				</div>
				<a onClick={() => window.history.back()} 
				   className='back iconHeader left'></a>
				
				
				<h1>{ this.state.titulo }</h1>
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
		this.setState({ visible: !this.state.visible });
	}
	render( props ) {

		if ( this.state.visible ) {
			return (
				<div>
					<div className={'popup show' + this.state.visible}>
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
				<a className="iconReloj" onClick={ this.toggle }>
					<span> { this.props.root.state.popupText } </span>
				</a> 
			);
		}
		
	}
}

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