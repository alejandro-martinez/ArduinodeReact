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
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
  	this.props.enabled = !this.props.enabled;
  }

  render() {
    return (
      <Switch className={'luz' + this.props.enabled } onClick={this.handleClick} />
    );
  }
}

class Luz extends Component {
	constructor( props ) {
		super( props );
		this.state = { luces: props.luces };
	}
	generateRow( item ) {
		return (
			<tr>
				<td> 
					<h4>{item.note}</h4>
				</td>	
				<td> 
					{ item.temporizada }
				</td>
				<td>
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

export class Salidas extends Component {
	constructor( props ) {
		super( props );
		console.log(props,this.props.params.ip)
		this.state = { salidas: [] }
	}
	componentWillMount() {
		var This = this;
		
		window.socket.on('salidas', function ( salidas ) {
			console.log("Salidas",salidas,)
			This.setState({salidas: salidas});
		});
		console.log(this.props.params.ip)
		window.socket.emit('getSalidas', { ip: this.props.params.ip });
	}
	render() {
		return (
			<div>
				<HTML.Table class="salidas">
					<Luz luces={ this.state.salidas } />
				</HTML.Table>
			</div>
		);
	}
};


export class Luces extends Component {
	constructor() {
		super();
		this.state = { salidas: [] }
	}
	componentDidMount() {
		var This = this;
		window.socket.on('lucesEncendidas', function ( salida ) {
			This.setState({salidas: This.state.salidas.concat([salida])});
		});
		
		window.socket.emit('getLucesEncendidas');
	}
	render() {
		return ( 
			<div>
				<HTML.Table class="salidas">
					<Luz luces={ this.state.salidas } />
				</HTML.Table>
			</div>
		);
	}
};