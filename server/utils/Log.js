// Log module
var DateConvert = require('./DateConvert')();

module.exports = function( msg )
{
	var pad = (n, width, z) => {
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
	}
	
	console.log( pad(msg + " ",70,"-"),">", DateConvert.getDate(), "-", DateConvert.getTime() );
}
