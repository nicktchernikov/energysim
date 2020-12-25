const express = require('express');

const routes = express.Router();

routes.get('/', (req, res) => {
    res.status(200).json({message: "Connected!"});
});

const appliances = require('./appliances');
const parts = require('./parts');

routes.use('/appliances', appliances);
routes.use('/parts', parts);

module.exports = routes;