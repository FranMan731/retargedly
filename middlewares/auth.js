'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = process.env.SECRET_TOKEN;
const mensaje = require('../utils/errors');

exports.ensureAuth = function(req, res, next) {
	if(!req.headers.authorization) {
		return res.status(403).send({message: mensaje.errorToken()});
	}

	const token = req.headers.authorization.replace(/['"]+/g, '');
	
	try {
		const payload = jwt.decode(token, secret);

		if(payload.exp <= moment().unix) {
			req.usuario = payload;
			
			return res.status(401).send({
				message: "El token ha expirado"
			});
		}
	} catch(e) {
		return res.status(404).send({
				message: "El token no es válido"
			});
	}

	next();
}