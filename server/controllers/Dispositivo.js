var Arduinode = require('../Arduinode').Arduinode,
	serverConfig = require('../config/config.json'),
	DataStore = require('../DataStore').DataStore;

var refreshDispositivos = function() {
};

module.exports = function( app ) {

	//Devuelve dispositivo por ID
	app.get('/dispositivo/id/:id_disp', function(req, res) {
		res.json( DataStore.findDispositivo('id_disp', req.params.id_disp) );
	});


	//Crea o modifica dispositivos
	app.post('/dispositivo/save', function(req, res)
	{
		DataStore.saveModel('dispositivos',req.body,'ip', function(err) {
			//Recargo dispositivos en memoria
			res.json({success: (err) ? false : true});
		});
	});

		//Crea o modifica dispositivos
	app.get('/dispositivo/delete/:id_disp', function(req, res)
	{
		var onDelete = function(err) {
			res.json({success: (err) ? false : true});			
		};
		DataStore.deleteModel('dispositivos',
								{id_disp: parseInt( req.params.id_disp )
		}, onDelete);
	});
};