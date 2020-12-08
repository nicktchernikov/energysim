const helpers = require("./helpers");

class Appliance {
	constructor( _id, _type, _watts1, _watts2, _location, _motive, _min, _max, _alwaysOn, _state, _outputWatts, _timeleft) {
		this.id = _id;
		this.type = _type; 

		this.location = _location;

		this.state = _state; // off when created
		this.watts1 = _watts1; // on watts
		this.watts2 = _watts2; // standby watts

		this.timesTurnedOn = 0;
		this.outputWatts = _outputWatts; // output watts

		this.motive = _motive;

		this.timeleft = _timeleft;
		this.min = _min;
		this.max = _max;

		this.alwaysOn = _alwaysOn;
	}
	
	turnOn() {
		this.state = 1;
		this.outputWatts = this.watts1;
		if(this.timeleft == 0) {
            let minutes = helpers.getRandomInt(this.min, this.max);
            this.timeleft = Math.max(1, Math.floor(minutes/15));
		}
	}

	turnOff() {
		this.state = -1; // off
		this.outputWatts = 0;
		this.timeleft = 0;
	}

	turnStandby() {
		this.state = 0;
		this.outputWatts = this.watts2;
		this.timeleft = 0;
	}
}

module.exports = Appliance