const fs = require("fs");
const path = require("path");

const Agent = require("./Agent.js");
const Appliance = require("./Appliance.js");

const applianceInits = require("./applianceInits.js");
//console.log(applianceInits);

if (process.argv) {
  setupId = process.argv[2];
} else {
  throw "No arguments passed to script!";
}
// Read and format setup data:
let simulation_json = fs.readFileSync("./setups/" + setupId + ".json");
let simulation = JSON.parse(simulation_json);
let settings = simulation[0].settings[0];

let rooms = simulation[1].rooms;

let _Start = settings.start;
let _Increment = parseInt(settings.increment);
let _Days = simulation[0].settings[0].days;
let _Watchfulness = settings.watchfulness;
let _Effect = settings.effect;

// Create appliance objects as per appliance inits data:
let applianceObjects = [];

rooms.forEach((room) => {
  ////console.log(room.appliances);
  room.appliances.forEach((appliance) => {
    let appliance_id = appliance.appliance_id;
    let appliance_type = appliance_id.split("_")[0];
    let appliance_init = applianceInits.filter((obj) => {
      return obj.type === appliance_type;
    });

    let watts1 = appliance_init[0].watts1; // on watts
    let watts2 = appliance_init[0].watts2; // standby watts

    let motive = appliance_init[0].motive;
    let min = appliance_init[0].min;
    let max = appliance_init[0].max;
    if (appliance_init[0].alwaysOn == true) {
      alwaysOn = true;
    } else {
      alwaysOn = false;
    }
    applianceObjects.push(
      new Appliance(
        appliance_id,
        appliance_type,
        watts1,
        watts2,
        room.room_id,
        motive,
        min,
        max,
        alwaysOn
      )
    );
    appliance.data = [];
    //appliance.data.push({x : [], y: []});
    appliance.data.push({ y: [] });
  });
});

lights = applianceObjects.filter((applianceObject) => {
  return applianceObject.type == "light";
});
hunger_appliances = applianceObjects.filter((applianceObject) => {
  return applianceObject.motive == "hunger";
});
boredom_appliances = applianceObjects.filter((applianceObject) => {
  return applianceObject.motive == "boredom";
});
comfort_appliances = applianceObjects.filter((applianceObject) => {
  return applianceObject.motive == "comfort";
});
cleanliness_appliances = applianceObjects.filter((applianceObject) => {
  return applianceObject.motive == "cleanliness";
});
hygiene_appliances = applianceObjects.filter((applianceObject) => {
  return applianceObject.motive == "hygiene";
});

// Create an agent:
let watchfulness = _Watchfulness; // determines how often the agent turns devices fully off after turning them on
agent = new Agent(watchfulness);

// Variables for running simulation:

// -- Amount of days to simulate:
const days = _Days;
//console.log("Days : " + days);

// -- Start time:
// let timestamp = _Start;
let timestamp = 1549312452;
let fakeDate = new Date(timestamp * 1000);
let dayOfWeek = fakeDate.getUTCDay();

// -- Timestep length in seconds:
const timestep_length = _Increment;

// -- Timesteps in one day:
const timesteps_in_one_day = (24 * 60 * 60) / timestep_length;

// -- Calculate total timesteps to log:
const timesteps = (days * 24 * 60 * 60) / timestep_length;
//console.log("Total timesteps: " + timesteps);

const delay = 0;
let t = 0;
let percentage_completed = 0;
let percentage_completed_update = 0;
let daysElapsed = 0;
let weekNum = 0;
let monthNum = 0;

let weeklyRoomData = [];
rooms.forEach((room) => {
  room_id = room.room_id;
  dataObj = {
    room_id: room_id,
    goals : [0.0,],
    totals : [0,],
    diffs: [0,],
    sliders: [0,],
  };
  weeklyRoomData.push(dataObj);
});

console.log(weeklyRoomData);

weekdays = [1, 2, 3, 4];
weekends = [0, 6];
// (Friday day of week is 5)

//agent.watchfulness = 0.0;
//let rateOfIncrease = 1.0 / timesteps;

simulationForward();

function simulationForward() {
  setTimeout(function () {
    // ... I'm setting a timeout just to be able to track the 'ticks' of the function

    // Test agent.wa tchfulness increasing scaled with time:
    //agent.watchfulness = Math.min(1.0, parseFloat(agent.watchfulness + rateOfIncrease));
    //console.log(agent.watchfulness);

    // Display percentage completed in console:
    percentage_completed_update = Math.ceil(100 * (t / timesteps));
    if (percentage_completed_update !== percentage_completed) {
      console.log(percentage_completed + "% Done");
      percentage_completed = percentage_completed_update;
    }
   
    daysElapsed = Math.floor(t/1440);
    
    // Triggers when exactly a week has elapsed
    if(Math.floor(daysElapsed/7) > weekNum || t == timesteps) {  
      if(t == timesteps) weekNum++;
      weeklyRoomData.forEach((data) => {
        // Goal is set to 10% less than the previous week's total minus 100
        data.diffs[weekNum] = data.totals[weekNum] - data.goals[weekNum];
        data.sliders[weekNum] = Math.min(data.diffs[weekNum]/data.goals[weekNum], 1.0);
        data.goals[weekNum+1] = data.totals[weekNum] - (data.totals[weekNum] * 0.10);
        data.totals[weekNum+1] = 0;
      });
 
      console.log("Weekly Room Totals:");
      console.log(weeklyRoomData);

      // Increase watchfulness if total exceeds goal
      // Note: this happens if any room exceeds goal, and only once
      // for the entire house.
      for(var j = 0; j < weeklyRoomData.length; j++) {
        data = weeklyRoomData[j];
        if(data.totals[weekNum] > data.goals[weekNum]) {
          console.log("Total exceeds goal for " + data.room_id + ", increasing watchfulness.");
          agent.watchfulness += (1.0 - agent.watchfulness) / 3; // rate of watchfulness increase ("alarm"?)
          agent.watchfulness = Math.min(1.0, agent.watchfulness); // maximum is always 1.0
          console.log("Agent watchfulness is now: " + agent.watchfulness);
          if(agent.watchfulness > 1.0) {
            agent.watchfulness = 1.0;
          }
          break;
        }
      }

      // Advance week number so this doesn't trigger again
      weekNum++;
      console.log("Week Number " + weekNum + " Over" );
    }
    // if(Math.floor(daysElapsed/30) > monthNum) {
    //   monthNum++;
    //   console.log("Month Number " + monthNum + " Over" );
    // }

    // Get time information based on current timestamp:
    let fakeDate = new Date(timestamp * 1000);
    let newDayOfWeek = fakeDate.getUTCDay();

    // -- Below code changes code when it's a new day of the week
    // if(dayOfWeek !== newDayOfWeek) {
    //     //console.log("*Day changed, changing watchfulness");
    //     agent.watchfulness += 0.075;
    //     if(agent.watchfulness > 0.99) agent.watchfulness = 0.99;
    //     //console.log("new watchfulness: ", agent.watchfulness);
    // }

    dayOfWeek = newDayOfWeek;

    // temp short circuit
    // completeSimulation();
    // t = timesteps;

    // if(newDayOfWeek !== dayOfWeek) {
    //     agent.watchfulness += 0.1;
    //     if(agent.watchfulness > 1.0) agent.watchfulness = 1.0;
    //     //console.log("CHANGING WATCHFULNESS");
    // }
    // let dayOfWeek = newDayOfWeek;
    hourOfDay = fakeDate.getUTCHours();

    // //console.log(dayOfWeek);

    // Stuff happens to environment

    // get historical data for a year
    // match date
    // if date's temp > x, turn on AC
    // if date's temp < x, turn on Heater

    // -- Start of Day and Time-Based Triggers

    // Go to sleep/wake up on weekdays
    if (weekdays.includes(dayOfWeek)) {
      if (agent.awake == false) {
        if (hourOfDay == 7) {
          //console.log('Agent is waking up.');
          agent.wakeUp();
        }
      } else {
        if (hourOfDay == 23) {
          //console.log('Agent is going to sleep.');
          agent.goToSleep();
          //console.log('Turning off all appliances.');
          applianceObjects.forEach((applianceObject) => {
            if (applianceObject.state == 1) {
              applianceObject.turnOff();
            }
          });
        }
      }
    }

    // Go to sleep/wake up on weekends
    if (weekends.includes(dayOfWeek)) {
      if (agent.awake == false) {
        if (hourOfDay == 9) {
          //console.log('Agent is waking up.');
          agent.wakeUp();
        }
      } else {
        if (hourOfDay == 0) {
          //console.log('Agent is going to sleep.');
          agent.goToSleep();
          //console.log('Turning off all appliances.');
          applianceObjects.forEach((applianceObject) => {
            if (applianceObject.state == 1) {
              applianceObject.turnOff();
            }
          });
        }
      }
    }

    // Wake up/go to sleep on fridays
    if (dayOfWeek == 5) {
      if (agent.awake == false) {
        if (hourOfDay == 7) {
          //console.log('Agent is waking up.');
          agent.wakeUp();
        }
      } else {
        if (hourOfDay == 0) {
          //console.log('Agent is going to sleep.');
          agent.goToSleep();
          //console.log('Turning off all appliances.');
          applianceObjects.forEach((applianceObject) => {
            if (applianceObject.state == 1) {
              applianceObject.turnOff();
            }
          });
        }
      }
    }
    // -- End of Days/Time-based Triggering

    //console.log('TIMESTEP #: ' + t);

    // Each appliance object has a timeleft value
    // The below code goes through each appliance and ticks down the time every timestep
    applianceObjects.forEach((applianceObject) => {
      if (applianceObject.timeleft > 0) {
        applianceObject.timeleft--;
      }
    });

    // Start of Triggering Based on Motivations and Conditions

    if (agent.home && agent.awake) {
      // Handle lights randomly
      if (Math.random() > 0.99) {
        // Turn on a random light
        lights.sort(() => 0.5 - Math.random());
        selected_lights = lights.slice(0, lights.length);
        selected_lights.forEach((selected_light) => {
          agent.changeApplianceState(selected_light);
        });
      }

      // Handle comfort_appliances randomly
      if (Math.random() > 0.99) {
        // Turn on a random appliance
        comfort_appliances.sort(function () {
          return 0.5 - Math.random();
        });
        selected_comfort_appliances = comfort_appliances.slice(
          0,
          comfort_appliances.length
        );

        selected_comfort_appliances.forEach((selected_comfort_appliance) => {
          //console.log('Changing state of ' + selected_comfort_appliance.id);
          agent.changeApplianceState(selected_comfort_appliance);
        });
      }

      // Handle hygiene_appliances randomly
      if (Math.random() > 0.99) {
        // Turn on a random appliance
        hygiene_appliances.sort(function () {
          return 0.5 - Math.random();
        });
        selected_hygiene_appliances = hygiene_appliances.slice(
          0,
          hygiene_appliances.length
        );
        selected_hygiene_appliances.forEach((hygiene_appliance) => {
          agent.changeApplianceState(hygiene_appliance);
        });
      }

      // Handle cleanliness_appliances randomly
      if (Math.random() > 0.99) {
        // Turn on a random appliance
        cleanliness_appliances.sort(function () {
          return 0.5 - Math.random();
        });
        selected_cleanliness_appliances = cleanliness_appliances.slice(
          0,
          cleanliness_appliances.length
        );
        selected_cleanliness_appliances.forEach((cleanliness_appliance) => {
          agent.changeApplianceState(cleanliness_appliance);
        });
      }

      // Hunger
      if (agent.hungerLevel >= 1.0 && !agent.cooking) {
        //console.log('Agent is hungry.');

        // Randomize
        hunger_appliances.sort(function () {
          return 0.5 - Math.random();
        });

        // 1 or more and less than half
        number_of_hunger_appliances = getRandomInt(
          1,
          hunger_appliances.length / 2
        );
        selected_hunger_appliances = hunger_appliances.slice(
          0,
          number_of_hunger_appliances
        );

        selected_hunger_appliances.forEach((hunger_appliance) => {
          agent.changeApplianceState(hunger_appliance);
        });
      }

      if (agent.hungerLevel >= 1.0 && agent.cooking) {
        sum = 0;
        hunger_appliances.forEach((hunger_appliance) => {
          sum += hunger_appliance.timeleft;
          agent.changeApplianceState(hunger_appliance);
        });
        ////console.log('Sum is ' + sum);
        if (sum == 0) {
          //console.log('Agent has eaten.');
          agent.eat();
        }
      }

      // Boredom
      ////console.log('boredomLevel: ' + agent.boredomLevel);
      ////console.log('agent.beingEntertained ' + agent.beingEntertained);

      if (agent.boredomLevel >= 1.0 && !agent.beingEntertained) {
        //console.log('Agent is bored.');
        // Randomize
        boredom_appliances.sort(function () {
          return 0.5 - Math.random();
        });

        // 1 or more and less than half
        number_of_boredom_appliances = getRandomInt(
          1,
          boredom_appliances.length / 2
        );
        selected_boredom_appliances = boredom_appliances.slice(
          0,
          number_of_boredom_appliances
        );

        selected_boredom_appliances.forEach((boredom_appliance) => {
          agent.changeApplianceState(boredom_appliance);
        });
      }

      if (agent.boredomLevel >= 1.0 && agent.beingEntertained) {
        sum = 0;
        boredom_appliances.forEach((boredom_appliance) => {
          sum += boredom_appliance.timeleft;
          agent.changeApplianceState(boredom_appliance);
        });
        ////console.log('Sum is ' + sum);
        if (sum == 0) {
          //console.log('Agent has been entertained.');
          agent.entertained();
        }
      }
      
      lights.forEach((light) => {
        if (light.state == 1 && light.timeleft == 0) {
          //console.log('Turning off ' + light.id);
          light.turnOff();
        }
      });

      comfort_appliances.forEach((comfort_appliance) => {
        if (comfort_appliance.state == 1 && comfort_appliance.timeleft == 0) {
          //console.log('Turning off ' + comfort_appliance.id);
          agent.changeApplianceState(comfort_appliance);
        }
      });

      hygiene_appliances.forEach((hygiene_appliance) => {
        if (hygiene_appliance.state == 1 && hygiene_appliance.timeleft == 0) {
          //console.log('Turning off ' + hygiene_appliance.id);
          agent.changeApplianceState(hygiene_appliance);
        }
      });

      cleanliness_appliances.forEach((cleanliness_appliance) => {
        if (
          cleanliness_appliance.state == 1 &&
          cleanliness_appliance.timeleft == 0
        ) {
          //console.log('Turning off ' + cleanliness_appliance.id);
          agent.changeApplianceState(cleanliness_appliance);
        }
      });
    }

    // Motivations change per timestep in agent
    agent.hungerLevel += 0.0025;
    agent.boredomLevel += 0.0025;

    let i = 0;
    rooms.forEach((room) => {
      let j = 0;
      room.appliances.forEach((appliance) => {
        let appliance_id = appliance.appliance_id;

        // Get appliance object:
        let applianceObject = applianceObjects.filter((obj) => {
          return obj.id === appliance_id;
        });
        applianceObject = applianceObject[0];

        // Turn on appliances that are always on.
        if (applianceObject.alwaysOn == true) {
          applianceObject.turnOn();
        }

        // When finished interactions, get the current watt output of appliance
        let watts = applianceObject.outputWatts;

        weeklyRoomData.forEach((data) => {
          if(data.room_id == room.room_id) {
            data.totals[weekNum] += watts;
          }
        });

        ////console.log("applianceObject.state: " + applianceObject.state + ", watts: " + watts);
        ////console.log("logging " + watts + " for appliance " + appliance_id);

        // Add values
        //appliance.data[0].x.push(t); // timestep
        appliance.data[0].y.push(watts); // watts
        j++;
      });
      i++;
    });

    t++;
    ////console.log(_Increment);
    ////console.log(timestamp);
    timestamp += _Increment;

    if (t < timesteps) {
      simulationForward();
    } else {
      completeSimulation();
    }
  }, delay);
}

function completeSimulation() {
  //let filename = new Date().getTime()+'.json';
  let filename = setupId + ".json"; // from process.argv[2]
  let simulation_completed = [];
  settings.filename = filename;
  //console.log(settings);
  simulation_completed.push(settings);
  rooms = condense_hourly(rooms);

  rooms.forEach((room) => {
    // add weekly data
    weeklyRoomData = weeklyRoomData.filter(d => d.room_id == room.room_id);
    room.weekly = weeklyRoomData;

    room.total_data = [];
    room.total_data.push({ y: [] });
    room.total_data.layout = {
      title: "total for " + room.room_id,
      xaxis: { title: "time (hours)" },
      yaxis: { title: "joules (watts/sec)" },
    };
    for (i = 0; i < timesteps / 60; i++) {
      i_total = 0;
      room.appliances.forEach((appliance) => {
        i_total += appliance.data[0].y[i];
      });
      room.total_data[0].y.push(i_total);
    }
  });

  // Write output to file:
  simulation_completed.push(rooms);
  let simulation_stringified = JSON.stringify(simulation_completed);
  fs.writeFile(
    path.join("outputs", filename),
    simulation_stringified,
    "utf8",
    (err) => {
      if (err) {
        throw err;
      } else {
        console.log("Wrote output to /outputs folder. Filename: " + filename);
      }
    }
  );
}

function condense_hourly(rooms) {
  //console.log("Condensing hourly.");
  for (i = 0; i < rooms.length; i++) {
    let appliances = rooms[i].appliances;
    for (j = 0; j < appliances.length; j++) {
      let appliance_data = appliances[j].data;
      let new_x = [];
      let new_y = [];
      let y_sum = 0;
      let x = 0;
      for (y_index = 0; y_index < appliance_data[0].y.length; y_index++) {
        y_sum += appliance_data[0].y[y_index];
        if ((y_index + 1) % 60 == 0) {
          new_x.push(x);
          new_y.push(y_sum);
          ////console.log("Calculated sum: " + y_sum);
          y_sum = 0;
          x++;
        }
      }
      ////console.log(new_y);
      rooms[i].appliances[j].data[0].y = new_y;
      //rooms[i].appliances[j].data[0].x = new_x; // x value is self-defined by y steps
      ////console.log( rooms[i].appliances[j].appliance_id );
      rooms[i].appliances[j].layout = {
        title: rooms[i].appliances[j].appliance_id + " in " + rooms[i].room_id,
        xaxis: { title: "time (hours)" },
        yaxis: { title: "joules (watts/sec)" },
      };
    }
  }
  ////console.log(rooms[0].appliances[0].data);
  return rooms;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
