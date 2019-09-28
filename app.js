'use strict'
const express = require('express');
const app = express();
const routes = require('./routes/index.js');
const cors = require('cors');

//middlewares
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cors());

//rutas
app.use(routes);

//Exportar
module.exports = app;