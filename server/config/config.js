var session = require('express-session'),
	bodyParser = require('body-parser');

module.exports.config = function( app, express) {

	app.use(express.static( process.cwd() + '/../build'));
	app.use(express.static( process.cwd() + '/../src'));
	
	app.set('modelsPath',process.cwd() + '/models/');
	app.set('port', process.env.PORT || 8888);
		
	//Cookies
	app.use(session({
		resave: true,
		saveUninitialized: true,
		expires : new Date(Date.now() + 36000),
		secret: 'uwotm8' })
	);

	//Encoding
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
};