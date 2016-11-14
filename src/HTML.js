import React, { Component } from 'react';

export class Header extends Component {
	constructor( props ) {
		super( props );
		this.state = { titulo: 'Home' };
	}
	render() {
		return (
			<header>
				<a onClick={() => window.history.back()} className="back iconHeader left"></a>
				<h1>{ this.state.titulo }</h1>
				<a href="/#/" className="menu iconHeader rigth"></a>
			</header>
		);
	}
};

export class LinkButton extends Component {
	render() {
		return ( <a className={ this.props.class } href={ '#/' + this.props.url }>{ this.props.text }</a> );
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
    		<LinkButton class={'button'} text={ item.text } url={  item.url } />
    	</li>);
  }
  render() {
    var items = this.props.items.map( this.generateItem );
    return ( <ul className="menuList"> {items} </ul> );
  }
};