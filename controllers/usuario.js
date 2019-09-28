'use strict';
const Usuario = require('../models/usuario.js');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('../services/jwt');
const mensajes = require('../utils/errors');
const moment = require('moment');

module.exports = {
	login: (req, res) => {
		const { usuario, password } = req.body;

		Usuario.findOne({ usuario }, (err, user) => {
			if (err) res.status(500).send({ message: mensajes.errorServidor() });

			if (user) {
				bcrypt.compare(password, user.password, (err, check) => {
					if (err) res.status(500).send({ message: mensajes.errorServidor() });

					if (check) {
						return res.status(200).send({
							token: jwt.createToken(user),
							expires: moment().add(30, 'days').format("YYYY-MM-DDTHH:mm:ss")
						});
					} else {
						return res.status(401).send({ message: mensajes.errorPassword() });
					}
				});
			} else {
				return res.status(401).send({ message: mensajes.userNotFound() });
			}
		});
	},

	register: (req, res) => {
		const { usuario, password } = req.body;
		const user = new Usuario();

    user.usuario = usuario;

		Usuario.find({
			$or: [ { usuario: usuario.toLowerCase() } ]
		}).exec((err, usuarios) => {
			if (err) res.status(500).send({ status: false });

			if (usuarios && usuarios.length >= 1) {
				return res.status(200).send({ status: false });
			} else {
				//Cifro la password y envio los datos
				bcrypt.hash(password, null, null, (err, hash) => {
					user.password = hash;

					user.save((err, userStored) => {
						if (err) return res.status(500).send({ status: false });

						if (userStored) {
							userStored.password = undefined;

							return res.status(200).send({
								token: jwt.createToken(userStored)
							});
						} else {
							return res.status(404).send({ status: false });
						}
					});
				});
			}
		});
	}
};
