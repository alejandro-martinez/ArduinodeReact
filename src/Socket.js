/*jshint esversion: 6 */
import io from 'socket.io-client'

// Inicializacion de socket para la comunicacion con el servidor
window.socket = io.connect( window.location.origin );

class Socket {
  emit() {}
  listen() {}
}

export default Socket;