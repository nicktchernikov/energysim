const fs = require("fs");
const path = require("path");

const helpers = require("./helpers");

const Agent = require("./Agent-new.js");
const Appliance = require("./Appliance-new.js");
const appInits = require("./applianceInits.js");

// Setup 
// -----

// Get setup data
setupId = process.argv[2];
effect = (process.argv[3] == 'true');

if(!setupId) throw "No setup ID.";

// House
let setup = JSON.parse(fs.readFileSync("./setups/" + setupId + ".json"));
let settings = setup[0].settings[0]; 
// ... settings.setupId, start, increment, days, effect, watchfulness
let rooms = setup[1].rooms;

// Agent
let watchfulness = settings.watchfulness;

// Simulation
let timestamp = settings.start;

// Messy
settings.effect = effect;

// Populate apps array with appliance objects
let apps = [];
rooms.forEach((room) => {
    room.appliances.forEach((app) => {
        type = app.appliance_id.split("_")[0];
        appInit = appInits.filter( a => a.type == type)[0];
        apps.push(
            new Appliance(
                app.appliance_id,
                type,
                appInit.watts1,
                appInit.watts2,
                room.room_id,
                appInit.motive,
                appInit.min,
                appInit.max,
                appInit.alwaysOn ? true : false
            )
        );
        app.data = [];
        app.data.push({y:[]});
    });
});

// Create weeklyRoomData
let weeklyRoomData = [];
rooms.forEach(room => weeklyRoomData.push({room_id: room.room_id, goals : [0,], totals : [0,], diffs : [0,], sliders : [0,]}));

// Create agent
a = new Agent(watchfulness);

// Motives for which appliances are randomly turned on 
motivesR = ['light', 'comfort', 'cleanliness', 'hygiene'];

// Apps to turn on randomly
appsR = apps.filter(app => motivesR.includes(app.motive));

// Hunger apps
appsH = apps.filter(app => (app.motive == 'hunger' && !app.alwaysOn));

// Boredom apps 
appsB = apps.filter(app => (app.motive == 'boredom' && !app.alwaysOn));

// Tracking
let pctDone = 0;
function updatePercentDone(newPctDone) {
    pctDone = newPctDone;
    //onsole.log(pctDone + "% Done");
}

let dayNum = 1;
function updateDayNum(newDayNum) {
    dayNum = newDayNum;
    //console.log("Day "+dayNum);
}

let weekNum = 0;

timesteps = Math.floor(settings.days*96); 
// ... timesteps is the amount of 15-minute blocks of time in the amount of days

// Simulate
// -----
for(timestep = 0; timestep < timesteps; timestep++) {
    // Percentage done:
    newPctDone = Math.ceil(100 * (timestep/timesteps));
    if(newPctDone > pctDone) updatePercentDone(newPctDone);

    // Days elapsed 
    newDayNum = Math.floor(timestep/96) + 1;
    if(newDayNum > dayNum) updateDayNum(newDayNum); 

    // Triggers when exactly a week has elapsed
    if(Math.floor(dayNum/7) > weekNum) {  
        weeklyRoomData.forEach((data) => {
          // Goal is set to 5% less than the previous week's total 
          data.diffs[weekNum] = data.totals[weekNum] - data.goals[weekNum];
          data.sliders[weekNum] = Math.min(Math.max(data.diffs[weekNum]/data.goals[weekNum], 0.0), 1.0);
          data.goals[weekNum+1] = data.totals[weekNum] - (data.totals[weekNum] * 0.05);
          data.totals[weekNum+1] = 0;
        });
   
        //console.log("Weekly Room Totals:");
        //console.log(weeklyRoomData);
  
        // Increase watchfulness if total exceeds goal
        // Note: this happens if any room exceeds goal, and only once
        // for the entire house.
        for(var j = 0; j < weeklyRoomData.length; j++) {
          data = weeklyRoomData[j];
          if(data.totals[weekNum] > data.goals[weekNum]) {
            // console.log("-----");
            // console.log("Total ("+data.totals[weekNum]+") exceeds goal ("+data.goals[weekNum]+") for " + data.room_id + ", increasing watchfulness.");
            // console.log("Next week goal: " + data.goals[weekNum+1]);
            // console.log("Slider for this week: "+data.sliders[weekNum]);
            // console.log("Diff/Goal: " + data.diffs[weekNum] + "/" + data.goals[weekNum] + " = " + data.diffs[weekNum]/data.goals[weekNum]);
            // console.log("-----");
            if(effect) {
                a.watchfulness += (1.0 - a.watchfulness) / 20; // rate of watchfulness increase ("alarm"?)
                a.watchfulness = Math.min(1.0, a.watchfulness); // maximum is always 1.0
            }
            // console.log("Agent watchfulness is now: " + a.watchfulness);
            if(a.watchfulness > 1.0) {
              a.watchfulness = 1.0;
            }
            break;
          }
        }
        // Advance week number
        weekNum++;
        console.log("Week Number " + weekNum + " Over" );
      }    

    // Agent wake up/go to sleep
    date = new Date(timestamp * 1000);
    hour = date.getUTCHours();
    if(!a.awake) {
        if(hour == 7) a.wakeUp();
    } else {
        if(hour == 23) { 
            a.goToSleep();
            apps.forEach(app => {if(app.state == 1) app.turnOff()});
        }
    }

    // Agent motivation changes
    a.hunger += 0.031;
    a.boredom += 0.031;

    // Decrease appliance time left
    // Turn off appliance if time left hits 0
    apps.forEach((app) => {
        app.timeleft = Math.max(app.timeleft-15, 0);
        if(app.timeleft == 0 && app.state == 1) a.changeApplianceState(app);
    });

    // Turn appliances on/off
    if(a.awake) {
        // Random 
        if(Math.random() > 0.95) {
            appsR.sort(() => Math.random() - 0.5);
            selected = appsR.slice(0, appsR.length);
            selected.forEach(s => a.changeApplianceState(s));
        }
        appsR.forEach((app) => { if(app.timeleft == 0 & app.state == 1) a.changeApplianceState(app); });

        // Hunger motivation
        if (a.hunger >= 1.0) {
            if(!a.cooking) {
                appsH.sort(() => Math.random() - 0.5);
                selected = appsH.slice(0, appsH.length);
                selected.forEach((s) => a.changeApplianceState(s));
            } else {
                if(appsH.every((app) => app.timeleft == 0)) {
                    //console.log("Agent has eaten.");
                    a.eat();   
                }
            }
        }

        // Boredom motivation
        if(a.boredom >= 1.0) {
            if(!a.beingEntertained) {
                appsB.sort(() => Math.random() - 0.5);
                selected = appsB.slice(0, appsB.length);
                selected.forEach((s) => a.changeApplianceState(s));
            } else {
                if(appsB.every((app) => app.timeleft == 0)) {
                    a.entertained();   
                }
            }
        }
    }

    // Store watts
    rooms.forEach((room) => {
        room.appliances.forEach((appliance) => {
            let appObj = apps.filter((appObj) => appObj.id == appliance.appliance_id)[0];
            if (appObj.alwaysOn == true) appObj.turnOn();
            let watts = appObj.outputWatts;
            appliance.data[0].y.push(watts);
            // Add watts to weekly total
            weeklyRoomData.forEach((data) => {
                if(data.room_id == room.room_id) data.totals[weekNum] += watts;
            });
        });
    });    

    // Add 15 minutes
    timestamp += (15*60);
}

// Finish 
// -----
output = [];
effect ? filename = setupId + "_effect.json" : filename = setupId + "_noEffect.json";

settings.filename = filename;
output.push(settings);

rooms = helpers.condense(rooms);
// ... Condense 15-minute datapoints to 1 hour data points

// Add room total data
rooms.forEach((room) => {
    room.totalData = [];
    room.totalData.push({y: []});
    room.totalData.layout = {title: "total for " + room.room_id, xaxis: { title: "time (hours)" }, yaxis: { title: "joules (watts/sec)"}};
    for(var i = 0; i < timesteps / 4; i++) {
        hourTotal = 0;
        room.appliances.forEach(app => hourTotal += app.data[0].y[i]);
        room.totalData[0].y.push(hourTotal);
    }
});

// Add weekly data
rooms.forEach((room) => {
    weekly = weeklyRoomData.filter((weekly) => room.room_id == weekly.room_id)[0];
    //console.log(weekly);
    room.weekly = weekly;
});

// Write data
output.push(rooms);
outputStr = JSON.stringify(output);
fs.writeFile("./outputs/"+filename, outputStr, "utf8", (err) => {
    if(err) { 
        throw err;
    } else {
        console.log("Wrote output to /outputs folder. Filename: " + filename);
    }
});