const data = require('../../data.json');

const appliance = (req, res) => {
    // appliance_id = parseInt(req.params.appliance_id);
    // const appliance = data.appliances.find(o => o.id == appliance_id);
    const appliance = req.appliance;
    res.status(200).json( {appliance} );
};

module.exports = appliance;