'use strict'

const express = require('express');
const app = express();

//Cargar ruta
const data_routes = require('./data.js');
const usuario_routes = require('./usuario.js');

//rutas
app.use('/', data_routes);
app.use('/', usuario_routes);

module.exports = app;