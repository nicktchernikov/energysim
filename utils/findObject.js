const data = require('../data.json');

module.exports = type => {
  return (req, res, next, value) => {
    const typePlural = `${type}s`;
    const obj = data[typePlural].find(t => t.id === parseInt(value));

    if (obj) {
      req[type] = obj;
      next();_
    } else {
      res.status(404).send(`Invalid ${type} ID`);
    }
  };
};