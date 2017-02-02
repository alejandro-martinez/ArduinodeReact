/*jshint esversion: 6 */
import React, { Component } from 'react';
import Socket from './Socket';
import { Link } from 'react-router';
import * as HTML from './HTML';
import { Dispositivo } from './Arduinode';

export class SelectSalida extends Component {
	constructor( props ) {
		super(props);
		this.onChange = this.onChange.bind( this );
	}
	onChange( e ) {
		this.props.onSelect( this.props.dispositivo, e.target.value );
	}
	generateRow( salida ) {
		var row = <option value={ salida.nro + "-" + salida.descripcion }>{ salida.descripcion }</option>;

		var salidaYaAgregada = this.props.salidasSelected.filter((d)=>{
			return d.ip === this.props.dispositivo.ip && d.nro == salida.nro;
		});
		
		return ( salidaYaAgregada.length ) ? null : row;
	}
	render() {
		if ( this.props.dispositivo ) {
			
			var salidas = this.props.dispositivo.salidas.map( this.generateRow, this);

			if ( salidas ) {
				return (<select onChange={ this.onChange }>
					<option value="">Selecciona salida</option>
					{ salidas }
				</select>);
			}
		}
		return null;
	}
};


export class SelectDispositivos extends Component {
	constructor( props ) {
		super( props );
		this.onChange = this.onChange.bind( this );
		this.state = { selected: null};
	}
	onChange( e ) {
		this.setState({ selected: this.props.root.getDispositivoByIP(e.target.value) });
	}
	componentDidMount() {
		this.setState({ selected: this.props.root.state.dispositivos[0] });	
	}
	render() {
		var dispositivos = this.props.root.state.dispositivos.map( ( item ) => {
			return (<option value={ item.ip }>{ item.descripcion }</option>);
		});

		return (
			<div className="dispositivosSelect">
				<select onChange={ this.onChange }>
					<option value="">Selecciona dispositivo</option>
					{ dispositivos }
				</select>
				<SelectSalida root={ this.props.root }
							  onSelect={ this.props.onAdd }
							  salidasSelected={ this.props.added } 
							  dispositivo={ this.state.selected }/>
			</div>
		);
	}
};

export class Dispositivos extends Component {
	constructor( props ) {
		super( props );
		this.props.route.root.setState({ 
			dbActual: "Dispositivo", 
			page: "Dispositivos",
			showAddIcon: true,
			showTimerIcon: false
		});
		this.onAddNew 	= this.onAddNew.bind( this );
		this.state 		= { edit: false };
	}
	componentDidMount() {
		document.addEventListener("onAddNew", this.onAddNew);
	}
	componentWillUnmount() {
		document.removeEventListener("onAddNew", this.onAddNew);
	}
	generateRow( item ) {
		var disp = this.props.route.root.getDispositivoByIP( item.ip );
		var salidasActivas = this.tieneLucesEncendidas( disp);

		return ( 
			<HTML.EditContainer key={item.ip} class={"disabled" + item.offline + " tieneLucesEncendidas" + (salidasActivas > 0)}>
				<td>
					<ul className="listIcons">
						<li className={"Dispositivos show" + !this.props.route.root.state.adminMode}> 
							<Link to={'Dispositivos/salidas/' + item.ip}>
								&#9854;
								<span className="Lamp0 nro"><Link>{ salidasActivas }</Link></span>
							</Link>
						</li>
						<li className='Delete onlyAdmin'>
							<a onClick={ this.onRemove.bind( this, item )}></a>
						</li>
					</ul>
				</td>
				<HTML.EditRow root={ this.props.route.root }
							   inputKey='descripcion'
							   model={ disp } />
				<td><a>{ item.version + (( item.offline) ? " - SIN CONEXION" : "")}</a></td>
				<HTML.EditRow root={ this.props.route.root }
							  inputKey='ip'
							  model={ disp } />
			</HTML.EditContainer>
		);
	}
	onAddNew() {
		var dispositivos = this.props.route.root.state.dispositivos;
		dispositivos.push( Dispositivo.newModel() );
		this.updateDispositivos( dispositivos );
	}
	updateDispositivos( dispositivos ) {
		this.props.route.root.setState({ 
			edit: true, 
			dispositivos: dispositivos,
			listenBroadcastUpdate: false
		});
	}
	tieneLucesEncendidas( dispositivo ) {
		if (dispositivo.offline) return 0;
		return this.props.route.root.getSalidasActivas( dispositivo ).length;
	}
	onRemove(item, e) {
		if (confirm("Seguro que desea quitar el dispositivo?")) {
			var dispositivos = this.props.route.root.state.dispositivos;
			var i = dispositivos.indexOf( item );
			dispositivos.splice(i, 1);
			this.updateDispositivos( dispositivos );
		}
	}
	render() {
		var rows = this.props.route.root.state.dispositivos.map( this.generateRow, this );
		return (<HTML.Table class={"dispositivos admin" + this.props.route.root.state.adminMode}> { rows } </HTML.Table>);
	}
};

export class SelectsDispositivos extends Component{
	constructor( props, model ) {
		super( props );
		this.model = model;
		this.root = props.route.root;
		['onRemove','onHidePopup', 'onAddNew','onChange'].forEach((m)=>{
			this[m] = this[m].bind(this);
		});
		this.state = { edit: false };
	}
	onRemove( dispositivo, e ) {
		if (confirm("Seguro que deseas quitar " + dispositivo.descripcion + "?")) {
			var i = this.model.dispositivos.indexOf( dispositivo );
			this.model.dispositivos.splice(i, 1);
			this.root.setState({ edit: true, listenBroadcastUpdate: false });
		}
	}
	generateRow( item ) {
		var descripcion = ( item.salidadescripcion )
						  ? item.salidadescripcion 
						  : "Salida " + item.nro;
		return ( 
			<tr className="col2">
				<td><a>{ item.descripcion + ' - ' + descripcion }</a></td>
				<td className="icons">
					<ul className="listIcons">
						<li className="DELETE onlyAdmin">
							<Link onClick={ this.onRemove.bind(this,item) }></Link>
						</li>					
					</ul>
				</td>
			</tr>
		);
	}
	componentDidMount() {
		document.addEventListener("onAddNew", this.onAddNew);
	}
	componentWillUnmount() {
		document.removeEventListener("onAddNew", this.onAddNew);
	}
	onChange ( item, e ) {
		item[e.target.name] = e.target.value;
		this.root.setState({ edit: true, listenBroadcastUpdate: false });
	}
	onHidePopup() {
		this.setState({ edit: false });	
	}
	onAddNew( dispositivo, salida ) {
		if ( dispositivo && salida ) { 
			var salidaParsed = salida.split("-"),
			newDispositivo = { 
				ip 				 : dispositivo.ip, 
				descripcion		 : dispositivo.descripcion,
				nro				 : salidaParsed[0],
				salidadescripcion: salidaParsed[1]
			};
			
			this.model.dispositivos.push( newDispositivo );		
			
			this.root.setState({ edit: true, listenBroadcastUpdate: false });
		}
		else {
			this.setState({ edit: true });
		}
	}
	render() {
		if ( this.root.state[  this.root.state.page.toLowerCase() ].length ) {
			var model = this.root.state[ this.root.state.page.toLowerCase() ].filter((t) => {
				return this.props.routeParams.id == t.id;
			});
			this.model = model[0];
			this.dispositivos = this.model.dispositivos.map( this.generateRow, this );
			return (
				<div>				
					<HTML.Table class={"salidas tareaDispositivos admin" + this.root.state.adminMode}> 
						{ this.dispositivos } 
					</HTML.Table>
					<div className={'show' + this.state.edit}>
						<SelectDispositivos added={ this.model.dispositivos } 
											onAdd={ this.onAddNew }
											root={ this.root } />
						<input type="button" onClick={ this.onHidePopup } value="Aceptar" />
					</div>
				</div>
			);
		}
		else {
			return null;
		}
	}
}