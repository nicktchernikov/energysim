const data = require('../../data.json');

const part = (req, res) => {
    // const part_id = parseInt(req.params.part_id);
    // const part = data.parts.find(o => o.id == part_id);
    const part = req.part;
    res.status(200).json( {part} );
};

module.exports = part;