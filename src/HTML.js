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
				<Link onClick={() => window.history.back()} className="back iconHeader left" />
				
				
				<h1>{ this.state.titulo }</h1>
				<Link to='/' className='menu iconHeader right'></Link>
			</header>
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