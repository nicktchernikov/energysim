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
		
		// integers 

		// motivations (floats)
		this.hungerLevel =  0.0;
		this.boredomLevel = 0.0;
	}

	changeApplianceState(appliance) {
		////console.log('Changing state.');
		////console.log(appliance.motive, appliance.state, this.hungerLevel);
		if(!this.cooking && appliance.motive == 'hunger' && (appliance.state == -1 || appliance.state == 0) && this.hungerLevel >= 1.0 && appliance.timeleft == 0) {
			////console.log('We in.');
			////console.log(Math.random(), this.watchfulness);
			if(Math.random() > this.watchfulness) { 
				//console.log('Agent is turning on ' + appliance.id);
				//console.log('Appliance state is ' + appliance.state);
				appliance.turnOn();
				//console.log('Appliance state is ' + appliance.state);
				//console.log('Appliance timeleft is ' + appliance.timeleft);
				this.cooking = true;
			} 
			
			// Need to handle case where Math.random is not > this.watchfulness

			// else {
			// 	// Leave appliance state as it is, but set a dummy timeleft value to avoid it triggering for that time span
			// 	appliance.state = appliance.state;
			// 	appliance.timeleft = getRandomInt(appliance.min, appliance.max);
			// }
		}

		if(!this.beingEntertained && appliance.motive == 'boredom' && (appliance.state == -1 || appliance.state == 0) && this.boredomLevel >= 1.0 && appliance.timeleft == 0) {
			////console.log('We in.');
			////console.log(Math.random(), this.watchfulness);
			if(Math.random() > this.watchfulness) { 
				//console.log('Agent is turning on ' + appliance.id);
				//console.log('Appliance state is ' + appliance.state);
				appliance.turnOn();
				//console.log('Appliance state is ' + appliance.state);
				//console.log('Appliance timeleft is ' + appliance.timeleft);
				this.beingEntertained = true;
			} 
			
			// Need to handle case where Math.random is not > this.watchfulness

			// else {
			// 	// Leave appliance state as it is, but set a dummy timeleft value to avoid it triggering for that time span
			// 	appliance.state = appliance.state;
			// 	appliance.timeleft = getRandomInt(appliance.min, appliance.max);
			// }
		}

		if(appliance.type == 'light' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				//console.log('Agent is turning on ' + appliance.id);
				appliance.turnOn();
			}
		}

		if(appliance.motive == 'comfort' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				//console.log('Agent is turning on ' + appliance.id);
				appliance.turnOn();
			}
		}

		if(appliance.motive == 'hygiene' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				//console.log('Agent is turning on ' + appliance.id);
				appliance.turnOn();
			}
		}

		if(appliance.motive == 'cleanliness' && appliance.timeleft == 0 && (appliance.state == -1 || appliance.state == 0)) {
			if(Math.random() > this.watchfulness) { 
				//console.log('Agent is turning on ' + appliance.id);
				appliance.turnOn();
			}
		}

		// Turn off an appliance if time is up 

		if(appliance.timeleft == 0 && appliance.state == 1 && appliance.alwaysOn == false) {
			////console.log('Agent is done using ' + appliance.id);
			if(Math.random() > this.watchfulness) {
				//console.log('Agent is turning standby ' + appliance.id);
				appliance.turnStandby();
			} else {
				//console.log('Agent is turning off ' + appliance.id);
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
		this.hungerLevel = 0.0;
		this.cooking = false;
	}

	entertained() {
		this.boredomLevel = 0.0;
		this.beingEntertained = false;
	}
	
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = Agent