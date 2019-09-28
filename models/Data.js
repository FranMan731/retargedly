'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DataSchema = Schema({
	name: String,
  segment1: String,
  segment2: String,
  segment3: String,
  segment4: String,
  platformId: Number,
  clientId: Number
});

module.exports = mongoose.model('Data', DataSchema);