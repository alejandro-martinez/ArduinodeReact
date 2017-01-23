// Log module
var DateConvert = require('./DateConvert')();
var serverConfig = require('../config/config.json');

module.exports = function( clase, msg ) {

	var pad = (n, width, z) => {
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
	}

	var logHabilitado = function( clase ) {
		var tipo = "";

		switch( clase ) {
			case 0: 
				tipo = 'tareas';
				break;
			case 1: 
				tipo = 'dispositivos';
				break;
			case 2:
				tipo = 'errores';
				break;
			default: 
				tipo = 'eventos';
		}

		return serverConfig.msjsLog[ tipo ];
	}

	if ( logHabilitado( clase )) {
		console.log( pad(msg + " ",70,"-"),">", DateConvert.getDate(), "-", DateConvert.getTime() );
	}
}
