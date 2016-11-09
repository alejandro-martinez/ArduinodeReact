var TaskManager = require('../TaskManager'),
	DataStore = require('../DataStore').DataStore;

module.exports = function( app ) {

	//Devuelve todos las tareas
	app.get('/tareas', function(req, res) {
		res.send( TaskManager.tareasJSON );
	});

	//Crea o modifica tareas
	app.post('/tarea/save', function(req, res) {

		// Nueva tarea, agregar al scheduler
		var onSave = function(response, tarea) {
			res.json(response);
			if (req.body.isNew) {
				TaskManager.loadScheduler();
			}
			// Tarea existente, se reprograma
			else {
				TaskManager.reprogramTarea( req.body.subtarea );
			}
		};
		DataStore.saveModel('tareas',req.body.model ,'id', onSave);
	});
}