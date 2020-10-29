class Appliance {
	constructor( _id, _type, _watts1, _watts2, _ontime, _maxtimes) {
		this.id = _id;
		this.type = _type; 
		this.watts1 = _watts1;
		this.watts2 = _watts2;
		this.ontime = _ontime;
		this.max_times = _maxtimes;
		this.last = 0;
		this.state = -1; // appliances are off by default - deal with 'always on' appliances
		this.watts = 0; // current output watts - off by default
		this.prob = 0; // probability of being turned on at a given timestep
	}
	
	turnOn() {
		this.state = 1;
		this.watts = this.watts1;
	}
	turnOff() {
		this.state = -1;
		this.watts = 0;
	}
	turnStandby() {
		this.state = 0;
		this.watts = this.watts2;
	}
	setProb(prob) {
		this.prob = prob;
	}
	setMaxTimes(times) {
		this.max_times = times;
	}
}

module.exports = Appliance