const data = require('../../../data.json');

const parts_of_appliance = (req, res) => {
    const appliance_id = parseInt(req.params.appliance_id);
    const parts = data.parts.filter(o => o.appliance_id == appliance_id);
    res.status(200).json( {parts} );
};

module.exports = parts_of_appliance;
