'use strict'

const express = require('express');
const DataController = require('../controllers/data.js');
const md_auth = require('../middlewares/auth.js');
const api = express.Router();

api.post('/data', md_auth.ensureAuth, DataController.createDate);
api.get('/data', md_auth.ensureAuth, DataController.getData);
api.get('/files/list', md_auth.ensureAuth, DataController.getFilesList);
api.get('/files/metrics', md_auth.ensureAuth, DataController.getMetrics);

module.exports = api;