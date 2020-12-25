const express = require('express');
const parts = express.Router();

const all = require('./all');
const single = require('./single');

parts.get('/', all);
parts.get('/:part_id', single);

let findObject = require('../../utils/findObject');
parts.param('part_id', findObject('part'));

// const data = require('../../data.json');

// parts.param('part_id', (req, res, next, value) => {
//   const part = data.parts.find(o => o.id === parseInt(value));

//   if (part) {
//     req['part'] = part;
//     next();
//   } else {
//     res.status(404).send('Invalid part ID');
//   }
// });

module.exports = parts;