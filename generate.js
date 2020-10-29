// TODO: 
// * Decide on final data model for JSON output
// ** Current data format is total watt usage per day
// * Be able to easily output data for a week with viewing every hour
// * chance ... how to better represent likelihood of 'turning on' an appliance
//   as a function of what time of day it is? Need more precise definition
// * What about a minimum bound for amount of times turned on per day? 
// * Ultimately for realism I will need to model complex interactions between 
//   the agent's actual daily actions and his use of appliances ... 
// * Store array of appliances in rooms 
// * Be able to display: 
// [next] ** Combined data for all appliances/rooms
// ** Specific room data
// [done] ** Specific appliances data 
// Later...
// * Web interface for creating a set of initial condtions
// * Real-time simulation of 1 time step per second
// * Add multipliers for various other factors: 
// ** Month
// ** Day of the week
// ** Type of agent
// *** I.e. Student, Employed person, Unemployed, etc... 
// ** Outside temperature

const e = require("express");
const plotlib = require('nodeplotlib');

const fs = require('fs');

const appliance_inits = require('./appliance_inits.js');
const chance = require('./Chance.js');
const Appliance = require('./Appliance.js');
const Agent = require('./Agent.js');

// --- Instatiate Appliance objects
appliance_objects = [];
for(i = 0; i < appliance_inits.length; i++) {
	type = Object.keys(appliance_inits[i])[0];
	watts1 = appliance_inits[i][type].watts1;
	watts2 = appliance_inits[i][type].watts2;
	ontime = appliance_inits[i][type].ontime;
	maxtimes = appliance_inits[i][type].maxtimes;
	appliance_objects.push( new Appliance(type, watts1, watts2, ontime, maxtimes) );
}

// --- Start plot data arrays

// = "";

// fs.readFileSync('./example_setup_data.json', (err, data) => {
// 	if(err) throw err;
// 	let houseSetup = JSON.parse(data);
// 	houseSetup.forEach( (room) => {
// 		//console.log(room.room_id);
// 		//console.log(room.appliances);
// 	});
// 	console.log(houseSetup);
// });

let houseSetupRaw = fs.readFileSync('./example_setup_data.json'); 
let house = JSON.parse(houseSetupRaw);

house.forEach( (room) => { 
	
});

const days = 10; 
const timestep_length = 15; // in minutes
const timesteps = 24 * days * 60 / timestep_length;
console.log(timesteps);

agent_watch_start = 0.5;

// --- Instantiate Agent object
agent = new Agent(agent_watch_start);

// Constants -- for step calculations 
step_duration = 15; 
steps_per_hour = (60 / step_duration);
steps_per_day = 24 * steps_per_hour;

days = 5; // this has to be passed in

total_total_watts = 0;

// appliance_objects has to be accessed for each room

appliance_objects.forEach( appliance_object => {
	// reset each appliance:
	last_step_on = null;
	console.log(`appliance on time: ${appliance_object.ontime}`);
	on_steps = onTimeToSteps(appliance_object.ontime, step_duration);
	console.log(`on_steps for ${appliance_object.type}: ${on_steps}`);
	start_step = 0;

	agent.changeHabits(agent_watch_start);

	// graph: 
	for (day = 0; day < days; day++) { 
		// reset each day: 
		max_times_to_turn_on = 1 + Math.floor(Math.random() * Math.floor(appliance_object.max_times));
		times_turned_on_day = 0;
		max_times_reached_day = false;
		total_watts = 0;

		//if(day == 33) { agent.changeHabits(0.5); }
		//if(day == 66) { agent.changeHabits(0.99); } 

		// hours: 
		for(hour = 0; hour < 24; hour++) {
			//console.log(hour);
			setChanceByHour(appliance_object, hour);
			start_step += steps_per_hour;
			for(step = start_step; step < (start_step + steps_per_hour); step++) {
				if(appliance_object.state == -1 || appliance_object.state == 0) {
					// appliance is off or in standby
					if( agent.home == 1 && !max_times_reached_day ) {
						random_chance = Math.random().toFixed(2);
						if( random_chance > (1.0 - appliance_object.prob) ) {
							// turn appliance on 
							appliance_object.turnOn();
							last_step_on = step;
							times_turned_on_day++; 
							if (times_turned_on_day >= max_times_to_turn_on ) max_times_reached_day = true;
						}
					}
				} else if (appliance_object.state == 1) {
					// appliance is on
					if(step - last_step_on >= on_steps) {
						// turn appliance off or into standby
						if( Math.random() > (1.0 - agent.watch) ) {
							//console.log("turning off");
							appliance_object.turnOff();
						} else {
							//console.log("turning standby");
							appliance_object.turnStandby();
						}
						//a.turnStandby();
					} 
				}
				//console.log(`Ouput: ${a.watts}`);
				//console.log(`adding ${appliance_object.watts} to daily total at step #${step}`);
				total_watts += appliance_object.watts;
				total_total_watts += appliance_object.watts;
			}
			// --- /reached end of hour
		}
		// console.log(`appliance ${a.type} was turned on ${times_turned_on_day} times`);
		// console.log(`day summary... ${day},`, `watts ouputted: ${total_watts}`);
		// console.log('\n');

		// --/ reached end of day 
		//console.log('---end of day---');

		//
		storeDataByAppliance(appliance_object.type, day, total_watts);
	}
});

console.log(`${days} day watt output: ${total_total_watts}`);

// data_arrays.forEach(data_array => {
// 	type = Object.keys(data_array)[0];
// 	//console.log(data_array);
// });


//--- Start functions
function setChanceByHour(appl, t) {
	// t refers to what hour it is on a 24 hour clock
	if(t >= 6 && t <= 11) appl.setProb(chance[appl.type]['day']['morning']);
	if(t >= 12 && t <= 18) appl.setProb(chance[appl.type]['day']['afternoon']);	
	if(t >= 18 && t <= 23) appl.setProb(chance[appl.type]['day']['evening']);	
	if(t >= 0 && t <= 6) appl.setProb(chance[appl.type]['day']['night']);	
}

function storeDataByAppliance(type, x_value, y_value) {
	data_arrays.forEach( (data_object) => {
		iter_type = Object.keys(data_object)[0];
		if(iter_type == type) 
			found_data_object = data_object;
	
	});
	if(found_data_object) {
		found_data_object[type][0].x.push(x_value);
		found_data_object[type][0].y.push(y_value);
	}
}

function onTimeToSteps(ontime, step_duration) {
	if(ontime < step_duration) ontime = step_duration;
	return Math.ceil(ontime / step_duration); 
}

// --- / End functions 
