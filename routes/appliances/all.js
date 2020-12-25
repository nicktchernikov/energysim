const data = require('../../data.json');

const all_appliances = (req, res) => {
    const appliances = data.appliances;
    res.status(200).json({ appliances });
};

module.exports = all_appliances;
