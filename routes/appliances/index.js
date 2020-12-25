const express = require('express');
const appliances = express.Router();

const parts = require('./parts');

const all = require('./all');
const single = require('./single');

appliances.get('/', all);
appliances.get('/:appliance_id', single);
appliances.use('/:appliance_id/parts', parts);

let findObject = require('../../utils/findObject');
appliances.param('appliance_id', findObject('appliance'));

// const data = require('../../data.json');

// appliances.param('appliance_id', (req, res, next, value) => {
//   const appliance = data.appliances.find(o => o.id === (value * 1));

//   if (appliance) {
//     req['appliance'] = appliance;
//     next();
//   } else {
//     res.status(404).send('Invalid appliance ID');
//   }
// });

module.exports = appliances;