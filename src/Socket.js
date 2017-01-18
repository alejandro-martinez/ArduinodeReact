/*jshint esversion: 6 */
import io from 'socket.io-client'
import Utils from './Utils';

// Inicializacion de socket para la comunicacion con el servidor
window.socket = io.connect( window.location.origin );

class SocketIO {
	emit( param, data ) {
		window.waitingBroadcast = true;
		Utils.fireEvent("loading", true);
		window.socket.emit( param, data );
	}
	listen( param, callback) {
		var onResponse = function( data ) {
			window.waitingBroadcast = false;
			Utils.fireEvent("loading", false);
			callback( data );
		};
		window.socket.removeListener( param ).on( param, onResponse);
	}
}
const Socket = new SocketIO();

export default Socket;