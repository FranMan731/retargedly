'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');

const secret = process.env.SECRET_TOKEN;

exports.createToken = function(user) {
	const payload = {
		sub: user._id,
		usuario: user.usuario,
		exp: moment().add(30, 'days').unix
	};

	return jwt.encode(payload, secret);
};