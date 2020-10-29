class Appliance {
	constructor( _id, _type, _watts1, _watts2, _location, _motive, _min, _max, _alwaysOn) {
		this.id = _id;
		this.type = _type; 

		this.location = _location;

		this.state = -1; // off when created
		this.watts1 = _watts1; // on watts
		this.watts2 = _watts2; // standby watts

		this.timesTurnedOn = 0;
		this.outputWatts = 0; // output watts

		this.motive = _motive;

		this.timeleft = 0;
		this.min = _min;
		this.max = _max;

		this.alwaysOn = _alwaysOn;
	}
	
	turnOn() {
		this.state = 1;
		this.outputWatts = this.watts1;
		if(this.timeleft == 0) {
			this.timeleft = getRandomInt(this.min, this.max);
		}
	}

	turnOff(watchfulness) {
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

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = Appliance