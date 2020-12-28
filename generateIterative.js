// Node imports
const fs = require("fs");
const path = require("path");

// Imports
const helpers = require("./helpers");
const Agent = require("./Agent.js");
const Appliance = require("./Appliance.js");
const appInits = require("./applianceInits.js");

// Setup 
// -----

let setupId = process.argv[2];

console.log("Simulation ID = " + setupId);

// - House rooms and settings
var setup;
var settings;
var rooms;

var initial = false;
try {
    setup = JSON.parse(fs.readFileSync("./outputs/"+setupId+".json"));
    settings = setup[0];
    settings.start = setup[0].nextWeek.start;
    settings.watchfulness = setup[0].nextWeek.watchfulness;
    settings.weekNum = parseInt(settings.weekNum) + 1;
    rooms = setup[1];
} catch (err) {
    setupFilename = setupId.split("_iterative")[0];
    console.log("setupFilename =" + setupFilename);
    setup = JSON.parse(fs.readFileSync("./setups/" + setupFilename + ".json"));
    settings = setup[0].settings[0];
    settings.weekNum = 0;
    rooms = setup[1].rooms;
    initial = true;  
}

console.log(">  Settings:");
console.log(settings);


const globals = require("./globals");
let min_watchfulness_increase = globals.min_watchfulness_increase;
let max_watchfulness_increase = globals.max_watchfulness_increase;

let watchfulness_increase_diff = max_watchfulness_increase - min_watchfulness_increase;

if(!initial) {
    // Change watchfulness with goal values
    let watchfulness = settings.watchfulness;
    let watchfulness_by_room = settings.watchfulness_by_room;

    console.log("[watchfulness_by_room]");
    console.log(watchfulness_by_room);
    console.log("[/watchfulness_by_room]");

    Object.keys(watchfulness_by_room).forEach((k) => {
        watchfulness_by_room[k] = parseFloat(watchfulness_by_room[k]);
    });

    for(i = 0; i < rooms.length; i++) {
        room = rooms[i];
        last_goal = parseInt(room.weekly.goals[room.weekly.goals.length-1]);
        last_total = parseInt(room.weekly.totals[room.weekly.totals.length-1]);

        if(last_goal < last_total) {
            let percentage = 1.0 - (parseFloat(last_goal) / parseFloat(last_total));
            let watchfulness_increase = globals.min_watchfulness_increase + (watchfulness_increase_diff * percentage);

            // Adjust room watchfulness here
            console.log(" > Increasing " + room.room_id + " watchfulness by " + watchfulness_increase + "!");
            watchfulness_by_room[room.room_id] += parseFloat(watchfulness_increase);
            watchfulness_by_room[room.room_id] = Math.min(watchfulness_by_room[room.room_id], 0.99);
        }
    }
    
    // Average 
    let sum = 0.0;
    Object.keys(watchfulness_by_room).forEach((k) => {
        sum += watchfulness_by_room[k];
    });
    watchfulness = parseFloat(sum / Object.keys(watchfulness_by_room).length);
    watchfulness = Math.min(1.0, watchfulness);

    // - Create agent
    a = new Agent(watchfulness, watchfulness_by_room);
} else {
    // - Agent
    let watchfulness = parseFloat(settings.watchfulness);
    watchfulness = Math.min(1.0, watchfulness);

    let watchfulness_by_room = settings.watchfulness_by_room;

    // - Create agent
    a = new Agent(watchfulness, watchfulness_by_room);
}

initial ? console.log(">  Using initial setup file") : console.log(">  Using existing output file");

// - Simulation
let timestamp = parseInt(settings.start);

// - Populate apps array with appliance objects
let apps = [];
rooms.forEach((room) => {
    room.appliances.forEach((app) => {
        type = app.appliance_id.split("_")[0];
        appInit = appInits.filter(a => a.type == type)[0];
        if(app.hasOwnProperty('endState')) {
            appState = app.endState.state;
            appOutputWatts = app.endState.outputWatts;
            appTimeleft = app.endState.timeleft;
        } else {
            appState = -1;
            appOutputWatts = 0;
            appTimeleft = 0;
        }
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
                appInit.alwaysOn ? true : false,
                // Below three have to be set from output 
                // endState if output existed:
                appState, 
                appOutputWatts,
                appTimeleft,
                app.in_room
            )
        );
        if(!app.hasOwnProperty('data')) {
            app.data = [];
            app.data.push({y:[]});
        }
        //console.log("app.data = " + JSON.stringify(app.data));
        //console.log("y entries = " + app.data[0].y.length);
    });
});

// - Create empty appliance data points arrays
let applianceDataPoints = [];
apps.forEach((appObj) => {
    appliance_id = appObj.id;
    emptyApplianceDatapointsArray = {};
    emptyApplianceDatapointsArray[appliance_id] = [];
    applianceDataPoints.push(emptyApplianceDatapointsArray);
});

// - Set current week number
let weekNum = parseInt(settings.weekNum);

// - Create weeklyRoomData or re-create using existing
let weeklyRoomData = [];
if(rooms.some(room => room.hasOwnProperty('weekly'))) {
    // Use existing
    rooms.forEach(room => {
        room.weekly.totals[weekNum] = 0;
        weeklyRoomData.push(room.weekly);
    });
} else {
    // Create new
    rooms.forEach(room => { 
        weeklyRoomData.push(
        {
            room_id: room.room_id,
            goals : [0,], 
            totals : [0,],
            watchfulness : [0.0,]
        });
    });
}

// - Create dailyRoomData or use existing

let dailyRoomData = [];
if(rooms.some(room => room.hasOwnProperty('daily'))) {
    // Use existing
    rooms.forEach(room => {
        dailyRoomData.push(room.daily);
    });
} else {
    // Create new
    rooms.forEach(room => {
        let appliancesDaily = [];
        room.appliances.forEach(appliance => {
            appliancesDaily.push(
                {
                    appliance_id : appliance.appliance_id,
                    dailyTotal : [0, ]
                }
            );
        });
        dailyRoomData.push(
            {
                room_id : room.room_id,
                dailyTotal : [0, ],
                appliances : appliancesDaily
            }
        );
    });
}

// var dailyRoomData;
// try {
//     // Use existing
//     dailyRoomData = JSON.parse(fs.readFileSync("./dailyOutputs/"+setupId+".json"));
//     console.log(">  Using existing dailyRoomData");
// } catch (err) {
//     // Create new
//     dailyRoomData = [];
//     console.log(">  Creating new dailyRoomData");

//     rooms.forEach(room => {
//         let appliancesDaily = [];
//         room.appliances.forEach(appliance => {
//             appliancesDaily.push(
//                 {
//                     appliance_id : appliance.appliance_id,
//                     dailyTotal : [0,]
//                 }
//             );
//         });
//         dailyRoomData.push(
//             {
//                 room_id: room.room_id,
//                 dailyTotal: [0,],
//                 appliances: appliancesDaily
//             });
//     });
// }

// - Motives for which appliances are randomly turned on 
randomMotives = ['light', 'comfort', 'cleanliness', 'hygiene'];
// - Apps to turn on randomly
appsRandomMotive = apps.filter(app => randomMotives.includes(app.motive));
// - Hunger apps
appsHunger = apps.filter(app => (app.motive == 'hunger' && !app.alwaysOn));
// - Boredom apps 
appsBoredom = apps.filter(app => (app.motive == 'boredom' && !app.alwaysOn));

// - For tracking
let pctDone = 0;
let dayNum = (weekNum * 7) - 1;

function updatePercentDone(newPctDone) {
    pctDone = newPctDone;
    //console.log(pctDone + "% Done");
}
function updateDayNum(newDayNum) {
    dayNum = newDayNum;
    //console.log("Day "+dayNum);
}

// Start Simulation Loop
// -----

console.log(">  Starting simulation...");

timesteps = 672; // 1 week of 15-minute timesteps
for(timestep = 0; timestep < timesteps; timestep++) {
    
    // Update percentage and day
    newPctDone = Math.ceil(100 * (timestep/timesteps));

    // Percentage ticks up
    if(newPctDone > pctDone) updatePercentDone(newPctDone);

    // Update dayNum
    newDayNum = (weekNum * 7) + Math.floor(timestep/96);

    // Day ticks over
    if(newDayNum > dayNum) {
        // Tick day up one
        updateDayNum(newDayNum); 
        
        // for debugging
        // console.log(
        //     "[dayNum] " + dayNum + " [/dayNum]"
        // );

        // Set next day up for each appliance
        dailyRoomData.forEach((data) => {
            data.dailyTotal[dayNum] = 0;
            data.appliances.forEach((app) => {
                app.dailyTotal[dayNum] = 0;
            });
        });
    }

    // - Start changing appliance states

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
        if(app.timeleft == 0 && app.state == 1) {
            a.changeApplianceState(app);
        }
    });

    // Turn appliances on/off
    if(a.awake) {
        // Random 
        if(Math.random() > 0.95) {
            appsRandomMotive.sort(() => Math.random() - 0.5);
            selected = appsRandomMotive.slice(0, appsRandomMotive.length);
            selected.forEach(s => {
                a.changeApplianceState(s);
            });
        }
        appsRandomMotive.forEach((app) => { if(app.timeleft == 0 & app.state == 1) a.changeApplianceState(app); });

        // Hunger motivation
        if (a.hunger >= 1.0) {
            if(!a.cooking) {
                appsHunger.sort(() => Math.random() - 0.5);
                selected = appsHunger.slice(0, appsHunger.length);
                selected.forEach((s) => a.changeApplianceState(s));
            } else {
                if(appsHunger.every((app) => app.timeleft == 0)) {
                    //console.log("Agent has eaten.");
                    a.eat();   
                }
            }
        }

        // Boredom motivation
        if(a.boredom >= 1.0) {
            if(!a.beingEntertained) {
                appsBoredom.sort(() => Math.random() - 0.5);
                selected = appsBoredom.slice(0, appsBoredom.length);
                selected.forEach((s) => a.changeApplianceState(s));
            } else {
                if(appsBoredom.every((app) => app.timeleft == 0)) {
                    a.entertained();   
                }
            }
        }
    }

    // Store/add watts
    rooms.forEach((room) => {
        room.appliances.forEach((appliance) => {
            let appObj = apps.filter((appObj) => appObj.id == appliance.appliance_id)[0];
            if (appObj.alwaysOn == true) appObj.turnOn();
            let watts = parseInt(appObj.outputWatts);
            
            // Add watts to temp applianceDataPoints object array
            datapoints = applianceDataPoints.filter(obj => obj.hasOwnProperty(appliance.appliance_id))[0];
            datapoints[appliance.appliance_id].push(watts);

            //appliance.data[0].y.push(watts);
            //console.log("pushed " + watts + " to y");
            //console.log("count: " + appliance.data[0].y.length);

            // Add watts to weekly total for the entire room
            weeklyRoomData.forEach((data) => {
                if(data.room_id == room.room_id) {
                    if(data.totals.length) {
                        data.totals[weekNum] += watts;
                    }
                }
            });
            dailyRoomData.forEach((data) => {
                if(data.room_id == room.room_id) {
                    data.dailyTotal[dayNum] += watts;
                }
                data.appliances.forEach(app => {
                    if(app.appliance_id == appliance.appliance_id) {
                        app.dailyTotal[dayNum] += watts;
                    }
                });
            });
        });
    });    

    // Increment 15 minutes (900 seconds) to timestamp
    timestamp += (15*60);
}
// ------
// End Simulation Loop

// Set endState for appliances
rooms.forEach(room => {
    room.appliances.forEach(appliance => {
        let appObj = apps.filter((appObj) => appObj.id == appliance.appliance_id)[0];
        appliance.endState = {
            "state" : appObj.state,
            "outputWatts" : appObj.outputWatts,
            "timeleft" : appObj.timeleft
        };
        //console.log(appliance.data[0].y);
    });
});

// Prepare next week's setup settings
let nextWeek = {
    "start": timestamp,
    "watchfulness": a.watchfulness, // Will change
    "watchfulness_by_room": a.watchfulness_by_room // Will change
};
settings.watchfulness = a.watchfulness;
settings.nextWeek = nextWeek;

// Condense all appliance y data 15-minute datapoints to 1 hour data points
for(j = 0; j < applianceDataPoints.length; j++) {
    datapointsObj = applianceDataPoints[j];
    key = Object.keys(datapointsObj)[0];
    datapoints = datapointsObj[key];
    condensed = [];
    sum = 0;
    for(i = 0; i < datapoints.length; i++) {
        sum += datapoints[i];
        if((i + 1) % 4 == 0) {
            condensed.push(sum);
            sum = 0;
        }
    }
    applianceDataPoints[j][key] = condensed;
}

rooms.forEach((room) => {
    room.appliances.forEach((appliance) => {
        applianceDataPoints.forEach(obj => {
            if (Object.keys(obj) == appliance.appliance_id) {
                datapointsObj = obj;
            }
        });
        key = Object.keys(datapointsObj)[0];
        datapoints = datapointsObj[key];
        for(i = 0; i < datapoints.length; i++) {
            appliance.data[0].y.push(datapoints[i]);
        }
    });
});

// Add weekly data to rooms
rooms.forEach((room) => {
    weekly = weeklyRoomData.filter((weekly) => room.room_id == weekly.room_id)[0];
    weekly.watchfulness[weekNum] = a.watchfulness_by_room[room.room_id];
    weekly.goals[(weekNum+1)] = weekly.totals[weekNum];
    room.weekly = weekly;

    daily = dailyRoomData.find(o => room.room_id == o.room_id);
    room.daily = daily;
});


// Add room totalData
rooms.forEach((room) => {
    room.totalData = [];
    room.totalData.push({y: []});
    room.totalData.layout = {title: "total for " + room.room_id, xaxis: { title: "time (hours)" }, yaxis: { title: "watts"}};
    for(var i = 0; i < timesteps / 4; i++) {
        hourTotal = 0;
        room.appliances.forEach(app => hourTotal += app.data[0].y[i]);
        room.totalData[0].y.push(hourTotal);
    }
});

let output = [];
output.push(settings);
output.push(rooms);

// Write data
outputString = JSON.stringify(output);
fs.writeFile("./outputs/"+setupId+".json", outputString, "utf8", (err) => {
    if(err) { 
        throw err;
    } else {
        console.log(">  Wrote ./outputs/"+setupId+".json");
    }
});

// // Write cumulative data by day
// dailyRoomDataString = JSON.stringify(dailyRoomData);
// fs.writeFile("./dailyOutputs/"+setupId+".json", dailyRoomDataString, "utf8",(err, _) => {
//     if(err) throw err;
//     console.log(">  Wrote ./dailyOutputs/"+setupId+".json");
// });