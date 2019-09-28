'use strict'

var express = require('express');
var UsuarioController = require('../controllers/usuario.js');
var md_auth = require('../middlewares/auth.js');
var api = express.Router();

api.post('/login', UsuarioController.login);
api.post('/register', UsuarioController.register);

module.exports = api;