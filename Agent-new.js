class Agent {
	constructor(_watchfulness) {
		// traits (floats)
		this.watchfulness = _watchfulness; // how watchful the Agent is about energy usage

		// booleans
		this.home = true; // home by default
		this.awake = true; // not asleep by default
		this.busy = false; // not doing anything by default 
		
		this.cooking = false;
		this.beingEntertained = false;
		
		// motivations (floats)
		this.hunger =  0.0;
		this.boredom = 0.0;
	}

	changeApplianceState(appliance) {
		if(!this.cooking && appliance.motive == 'hunger' && (appliance.state == -1 || appliance.state == 0) && this.hunger >= 1.0 && appliance.timeleft == 0) {
			if(Math.random() > this.watchfulness) { 
				appliance.turnOn();
				this.cooking = true;
			} 
		}

		if(!this.beingEntertained && appliance.motive == 'boredom' && (appliance.state == -1 || appliance.state == 0) && this.boredom >= 1.0 && appliance.timeleft == 0) {
			if(Math.random() > this.watchfulness) { 
				appliance.turnOn();
				this.beingEntertained = true;
			} 
		}

		if(appliance.type == 'light' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				appliance.turnOn();
			}
		}

		if(appliance.motive == 'comfort' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				appliance.turnOn();
			}
		}

		if(appliance.motive == 'hygiene' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				appliance.turnOn();
			}
		}

		if(appliance.motive == 'cleanliness' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				appliance.turnOn();
			}
		}

		// Turn off an appliance if time is up 
		if(appliance.timeleft == 0 && appliance.state == 1 && appliance.alwaysOn == false) {
			if(Math.random() > this.watchfulness) {
				appliance.turnStandby();
			} else {
				appliance.turnOff();
			}
		}
	}
	
	changeWatchfulness(_w) {
		this.watchfulness = _w;
	}
	// -- 

	arriveHome() {
		this.home = true; 
	}

	leaveHome() {
		this.home = false; 
	}

	// -- 
	
	goToSleep() {
		this.awake = false;
		this.beingEntertained = false;
		this.cooking = false;
	}

	wakeUp() {
		this.awake = true;
		this.energyLevel = 1.0;
	}

	// -- 
	eat() {
		this.hunger = 0.0;
		this.cooking = false;
	}

	entertained() {
		this.boredom = 0.0;
		this.beingEntertained = false;
	}
	
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = Agent