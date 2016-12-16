var net 		 = require('net');
var serverConfig = require('./config/config.json');

module.exports = function()
{
	var Socket =
	{
		socketClient: {},
		_socket: {},
		client: {},
		errors: {
				"ENOTFOUND": "No se encontró dispositivo en el socket solicitado: ",
				"EHOSTUNREACH": "Dispositivo no alcanzado",
				"ECONNREFUSED": "Conexión rechazada: Chequea la IP y puerto ",
				"TIMEOUT": "Se alcanzó el tiempo de espera límite para la conexión!"
		},
		//Conexion al socket arduino
		connect: function(ip, callback)
		{
			var socket = new net.Socket();
			socket.setTimeout( serverConfig.socketTimeout || 500);

			socket.connect(8000, ip, function(response) {
				callback(1, socket);
			});

			socket.on('error', function(_err) {
				callback();
			});

			socket.on('timeout',function(_err) {
				callback();
			});
		},
		//Envia comando al socket. Viene en params.command
		send: function(params, callback) {

			var This = this;
			This.data = "";
			if (params.ip) {
				this.connect(params.ip, function(response, socket) {
					
					if (response) {
						socket.write(params.comando);
					
						socket.on('data',function( _data ) {

							This.data+= _data.toString();
						});

						socket.on('end', function() {
							callback( This.data, params.ip );
						});
					}
					else {
						callback();
					}
				});
			}
		},
	};
	return Socket;
};