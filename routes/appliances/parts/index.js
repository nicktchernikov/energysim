const express = require('express');
const parts = express.Router({ mergeParams: true });
const all = require('./all');

parts.get('/', all);

module.exports = parts;