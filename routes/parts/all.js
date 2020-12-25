const data = require('../../data.json');

const all_parts = (req, res) => {
    const parts = data.parts;
    res.status(200).json( {parts} );
};

module.exports = all_parts;