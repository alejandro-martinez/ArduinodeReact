/*jshint esversion: 6 */
import io from 'socket.io-client'

// Inicializacion de socket para la comunicacion con el servidor
window.socket = io.connect( window.location.origin );

class SocketIO {
	emit( param, data ) {
		window.socket.emit( param, data );
	}
	listen( param, callback) {
		window.socket.removeListener( param ).on( param, callback );
	}
}
const Socket = new SocketIO();

export default Socket;