'use strict'
require('./config');
const mongoose = require('mongoose');
const app = require('./app');

//Conexión a base de datos
mongoose.Promise = global.Promise;
mongoose.connect(process.env.URLDB,  { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		console.log("La conexión se ha realizado con éxito.");

		//Crea el servidor
		app.listen(process.env.PORT, () => {
			console.log("Servidor corriendo en http://localhost:65000 .");
		});
	})
	.catch(err => console.log(err));