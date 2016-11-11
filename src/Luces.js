/*jshint esversion: 6 */
import React, { Component } from 'react';
import * as HTML from './HTML';
import Switch from 'react-toggle-switch'
/*
<Switch onClick={() => this.setState({prop: !this.state.prop})}/>
<Switch onClick={this.toggle}>
  <i class="some-icon"/>
</Switch>
<Switch enabled={false}/>
<Switch className='other-class'/>
*/

class Toggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { enabled: true };

    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
  	console.log("ASDASD",this.state)
  }

  render() {
    return (
      <Switch enabled={ this.state.enabled } onClick={this.handleClick} />
    );
  }
}

class ListaLuces extends Component {
	constructor( props ) {
		super(props);
		this.state = { luces: props.luces };
	}
	generateRow( item ) {
		return (
			<tr>
				<td> 
					<h4>{item.note}</h4>
					<Toggle enabled={ item.estado } />
				</td>
			</tr>
		);
	}
	render() {
		var rows = this.props.luces.map( this.generateRow );	
    	return ( <div> {rows} </div> );
	}
};

class Luces extends Component {
	constructor() {
		super();
		this.state = { lucesEncendidas: [] }
	}
	componentDidMount() {
		var This = this;
		
		window.socket.on('lucesEncendidas', function ( luzEncendida ) {
			This.setState({lucesEncendidas: This.state.lucesEncendidas.concat([luzEncendida])});
		});
		
		window.socket.emit('getLucesEncendidas');
	}
	render() {
		return ( 
			<div>
				<HTML.Table class="salidas">
					<ListaLuces luces={ this.state.lucesEncendidas } />
				</HTML.Table>
			</div>
		);
	}
};

export default Luces;