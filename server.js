const path = require("path");
const fs = require("fs");

// Express 
const express = require("express");
var exphbs = require("express-handlebars");
const app = express();
app.use(express.static("views")); // Folder name for static files
app.use(express.urlencoded());
app.use(express.json());

// Handelebars
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// PORT
const PORT = process.env.PORT || 3000;

// Default sessionSettings and sessionHouse variables
const sessionSettings = {
  days: 365,
  watchfulness: 0.01
};
const sessionHouse = [];

// Load appliance data 
const applianceInits = require("./applianceInits.js");

// Start the server
app.listen(PORT, () => {
  console.log("Running server on port " + PORT + ".");
});

// Render Index page (HTML)
app.get("/", (req, res) => {
  res.render("index", {
    sessionHouse: sessionHouse,
    sessionSettings: sessionSettings,
    helpers: {
      json: function (context) { return JSON.stringify(context);}
    }
  });
});

// Render Generate page (HTML)
app.get('/generate', (_, res) => res.render('generate'));

// Render Results page (HTML)
app.get("/results", (req, res) => {

  let errors = false;

  filenames = fs.readdirSync(path.join(__dirname, "outputs"));
  filenames = filenames.filter(f => f != '.gitkeep');

  if(filenames.length == 0) {
    errors = true; 
    res.status(200).json( {"Error" : "There are no output files"} );
  } else {
    filename = filenames[0]; // Choose first filename in list by default
  }
  
  if(!errors) {
    fs.readFile(path.join(__dirname, "outputs", filename), (err, data) => {
      if (err) {
        res.status(200).json({"Error" : "Cannot read output " + filename});
        throw err;
      }
      let filename_dataset = JSON.parse(data);
      let filenames = fs.readdirSync(path.join(__dirname, "outputs"));
      res.render("results", {
        filename_dataset,
        filenames,
        helpers: {
          json: function (context) { return JSON.stringify(context); },
        },
      });
    });
  }
});

// Functionto get Output Data and pass JSON object into a callback
function getOutputData(outputId, callback) {
  fs.readFile("./outputs/"+outputId+".json", "utf8", (err, data) => {
    if(err) throw err;
    callback(JSON.parse(data));
  });
}

/* 
    App Routes: 
    ----------
*/
app.post('/post', (req, res) => {
  res.json(req.body);
});

app.get('/getRoomIds/:outputId', (req, res) => {
  output_id = req.params.outputId;
  //console.log(output_id);

  room_ids = [];
  fs.readFile('./outputs/'+output_id+'.json', 'utf8', (err, read_file_response) => {
    if(err) throw err;
    sim = JSON.parse(read_file_response);
    rooms = sim[1];
    rooms.forEach((room) => {
      room_ids.push(room.room_id);
    });
    //console.log(room_ids);
    res.json(room_ids);
  });

});

// Get applianceInits.js as JSON from frontend
app.get('/applianceInits', (_,res) => res.json(applianceInits));

// Helper to easily render JSON files
app.get("/*.json", (req, res) => res.json(require("./" + req.url)));

// Get Session Settings as JSON
app.get('/getSessionSettings', (_, res) =>  res.json(sessionSettings));

// Set Session Setup Id 
app.post('/setSessionSetupId', (req, res) => {
  sessionSettings.setupId = req.body.setupId;
  res.status(200).send();
});

// Check that a Setup file exists
app.post('/setupExists', (req, res) => {
  let setupId = req.body.setupId;
  fs.readdir('./setups', (err, filenames) => {
    if(err) throw err;
    result = false;
    filenames.forEach(filename => {
      if(setupId+'.json' == filename) {
        result = true;
      }
    });
    res.json({'exists' : result});
  });
});

// Set Session Setup using Setup Id
app.post('/setSetupSessionWithSetupId', (req, res) => {
  let setupId = req.body.setupId;
  fs.readFile('./setups/'+setupId+'.json', 'utf8', (err, data) => {
    if(err) throw err;
    json = JSON.parse(data);
    settings = json[0].settings[0];
    rooms = json[1].rooms;
    Object.assign(sessionSettings, settings);
    sessionHouse.splice(0, sessionHouse.length);
    rooms.forEach(room => sessionHouse.push(room));  
  });

  res.status(200).send();
});

// Reset sessionHouse and sessionSettings
app.get('/resetSession', (req, res) => {
  let settings = {
    days: 365,
    watchfulness: 0.01
  };
  sessionHouse.splice(0, sessionHouse.length);
  Object.assign(sessionSettings, settings);

  res.status(200).send();
});

// Empty sessionHouse and return as JSON
app.get("/emptyHouse", (req, res) => {
  sessionHouse.splice(0, sessionHouse.length);
  res.json(sessionHouse);
});

// Get sessionHouse as JSON
app.get("/getSessionHouse", (_, res) => res.json(sessionHouse));

// Add a room to the sessionHouse
app.post("/add-room", (req, res) => {
  name = req.body.name.replace(" ", "_");
  room = { room_id: name, appliances: [] };
  sessionHouse.push(room);

  res.status(200).send();
});

// Add an appliance to a room in sessionHouse
app.post("/add-appliance", (req, res) => {
  let room_id = req.body.room_id;
  let appliance_id = req.body.appliance_id;
  let i = 0;
  sessionHouse.forEach((room) => {
    if (room.room_id == room_id) {
      sessionHouse[i].appliances.push({ appliance_id: appliance_id, in_room : room.room_id });
    }
    i++;
  });

  res.status(200).send();
});

// Remove appliance from room in sessionHouse
app.post("/remove-appliance", (req, res) => {
  let room_id = req.body.room_id;
  let appliance_id = req.body.appliance_id;
  //console.log(room_id, appliance_id);
  let i = 0;
  sessionHouse.forEach((room) => {
    if (room.room_id === room_id) {
      let j = 0;
      room.appliances.forEach((appliance) => {
        if (appliance.appliance_id == appliance_id) {
          sessionHouse[i].appliances.splice(j, 1);
        }
        j++;
      });
    }
    i++;
  });
  res.redirect("/");
});

// Remove room in sessionHouse
app.post("/remove-room", (req, res) => {
  roomId = req.body.room_id;
  for (i = 0; i < sessionHouse.length; i++) {
    if (sessionHouse[i].room_id == roomId) {
      sessionHouse.splice(i, 1);
    }
  }
  res.status(200).send();
});

// Get setup filenames as JSON
app.get("/getSetups", (req, res) => {
  fs.readdir("./setups", (err, files) => {
    if (err) {
      res.json();
    } else {
      files = files.filter(f => f != '.gitkeep');
      res.json(files);
    }
  });
});

// Get one setup file as JSON
app.get('/getSetup/:setupId', (req, res) => {
  let setupId = req.params.setupId;
  fs.readFile('./setups/'+setupId+'.json', 'utf8', (err, data) => {
    if(err) throw err;
    res.json(JSON.parse(data));
  });
});

// Get output filenames as JSON 
app.get("/getOutputs", (_, res) => {
  fs.readdir("./outputs", (err, files) => {
    if (err) throw err;
    res.json(files);
  });
});

// Check that an iterative output exists already
app.get("/iterativeOutputExists/:setupId", (req, res) => {
  let exists = fs.existsSync("./outputs/"+req.params.setupId+".json"); 
  res.json({"outputExists" : exists});
});

// Save a setup file 
app.post("/saveSetup", (req, res) => {
  settings = [];
  settings.push(req.body);
  rooms = sessionHouse;

  let errors = false;
  // -- Check if there are no rooms
  if(rooms.length == 0) {
    res.json( {"error" : "No rooms"} );
    errors = true;
  } else {
    // -- Check if any existing room has no appliances 
    rooms.forEach((room) => {
      if (room.appliances.length == 0) {
        res.json( {"error" : "No appliances"} );
        errors = true;
      }
    });

    if(!errors) {
      settings[0].watchfulness_by_room = {};
      rooms.forEach((room) => {
        settings[0].watchfulness_by_room[room.room_id] = parseFloat(settings[0].watchfulness);
      });

      data = [];
      data.push({ settings });
      data.push({ rooms });

      json = JSON.stringify(data, null, 4);
      fs.writeFile("./setups/" + req.body.setupId + ".json", json, (err) => {
        if (err) throw err;
        res.status(200).send();
      });
    }
  }

});

// Render Results page for specific Output id (HTML) 
// * clean up this function
app.get("/results/:results_filename_id/:type?", (req, res) => {
  filenames = fs.readdirSync(path.join(__dirname, "outputs"));
  results_filename = req.params.results_filename_id + ".json";
  type = req.params.type;

  fs.readFile(
    path.join(__dirname, "outputs", results_filename),
    (err, data) => {
      if (err) {
        dataset = [];

        res.render("results", {
          dataset,
          filenames,
          helpers: {
            json: function (context) {
              return JSON.stringify(context);
            },
          },
        });
      } else {
        json_data = JSON.parse(data);

        settings = json_data[0];
        rooms = json_data[1];
        // *Can do stuff with rooms here*
        if (type == "total") {
          rooms.forEach((room) => {
            room.appliances.forEach((appliance) => {
              newY = [];
              sumY = 0;
              for (i = 0; i < appliance.data[0].y.length; i++) {
                sumY += appliance.data[0].y[i];
                newY.push(sumY);
              }
              appliance.data[0].y = newY;
            });
            newY = [];
            sumY = 0;
            for (i = 0; i < room.totalData[0].y.length; i++) {
              sumY += room.totalData[0].y[i];
              newY.push(sumY);
            }
            room.totalData[0].y = newY;
          });
        }

        let dataset = [];

        dataset.push(settings);
        dataset.push(rooms);

        res.render("results", {
          dataset,
          filenames,
          helpers: {
            json: function (context) {
              return JSON.stringify(context);
            },
          },
        });
      }
    }
  );
});

// Get Output File as JSON and sum the values
app.get('/getOutputTotalJSON/:outputId', (req, res) => {
  let outputId = req.params.outputId;
  console.log(outputId);
  fs.readFile('./outputs/'+outputId+'.json', 'utf8', (err, data) => {
    //TODO
    // - 
      let json = JSON.parse(data);
      let settings = json[0];
      let rooms = json[1];

      rooms.forEach((room) => {
        room.appliances.forEach((appliance) => {
          newY = [];
          sumY = 0;
          for (i = 0; i < appliance.data[0].y.length; i++) {
            sumY += appliance.data[0].y[i];
            newY.push(sumY);
          }
          appliance.data[0].y = newY;
        });
        newY = [];
        sumY = 0;
        for (i = 0; i < room.totalData[0].y.length; i++) {
          sumY += room.totalData[0].y[i];
          newY.push(sumY);
        }
        room.totalData[0].y = newY;
      });
      let totalDataset = [];
      totalDataset.push(settings);
      totalDataset.push(rooms);
      
      res.json(totalDataset);
  });
});

// Run generate scripts as child processes 
// * Does it once with 'effect', and once without
app.get("/generate/:setupId", (req, res) => {
  let setupId = req.params.setupId;
  if(!setupId) throw "No Setup Id provided.";

  runScript("./generateDaily.js", [setupId, true], function (err) {
    if (err) throw err;
  });
  runScript("./generateDaily.js", [setupId, false], function (err) {
    if (err) throw err;
  });
  res.json("Running scripts!");
});

app.get("/generateIterative/:setupId", (req, res) =>{
  let setupId = req.params.setupId;
  if(!setupId) throw "No Setup Id provided.";

  runScript("./generateIterative.js", [setupId], function (err) {
    if (err) {
      res.json({"done" : false});
      throw err;
    } else {
      res.json({"done" : true});
    }
  });
});

// Chunk hours by week and output as JSON
app.get("/weekly/:outputId", (req, res) => {
  getOutputData(req.params.outputId, (data) => {
    if(!data) { res.json({"status" : false}); }
    let settings = data[0];
    let rooms = data[1];
    rooms.forEach((room) => {
      room.appliances.forEach((appliance) => {
        let y = appliance.data[0].y;
        appliance.data[0].y = y.chunk(168); // 168 = 4 timesteps per hour * 24 hours * 7 days
      });
      room.totalData = room.totalData[0].y.chunk(168);
    });
    res.status(200).json([settings, rooms]);
  });
});

// Chunk hours -> weeks and output as JSON for a specific week 
app.get("/weekly/:outputId/:weekNum", (req, res) => {
  getOutputData(req.params.outputId, (data) => {
    let settings = data[0];
    let rooms = data[1];
    rooms.forEach((room) => {
      room.appliances.forEach((appliance) => {
        let y = appliance.data[0].y;
        appliance.data[0].y = y.chunk(168);
      });
      room.totalData[0].y = room.totalData[0].y.chunk(168);
    });
    if(req.params.weekNum) {
      let weekNum = req.params.weekNum;
      rooms.forEach((room) => {
        let newY = room.totalData[0].y[weekNum];
        room.totalData[0].y = [];
        room.totalData[0].y.push(newY);
      });
    }
    res.status(200).json([settings, rooms]);
  });
});

// Return only the weeklyData for an Outpud ID
// * used within Unity
app.get("/unity/:output_id", (req, res) => {
  //console.log("running");
  let output_id = req.params.output_id;
  if(output_id.length > 0) {
    getOutputData(output_id, (data) => {
      let weeks_by_room = [];
      let days_by_room = [];
      rooms = data[1];
      rooms.forEach((room) => {
        weeks_by_room.push(room["weekly"]);
        days_by_room.push(room["daily"]);
      });
      res.json(
        {
          "weeks_by_room" : weeks_by_room, 
          "days_by_room" : days_by_room 
        }
      );
    });
  } else {
    res.json( {error: "No output_id provided."} );
  }
});

// Render weeks page (HTML) 
// * Takes <outputID> and optional <weekNum> 
app.get("/weeklyResults/:outputId/:weekNum?", (req, res) => {
  getOutputData(req.params.outputId, (data) => {
    let settings = data[0];
    let rooms = data[1];
    rooms.forEach((room) => {
      room.appliances.forEach((appliance) => {
        let y = appliance.data[0].y;
        appliance.data[0].y = y.chunk(168);
      });
      room.totalData[0].y = room.totalData[0].y.chunk(168);
    });
    if(req.params.weekNum) {
      let weekNum = req.params.weekNum - 1;
      //console.log("weekNum: " + weekNum);
      rooms.forEach((room) => {
        let newY = room.totalData[0].y[weekNum];
        room.totalData[0].y = [];
        room.totalData[0].y.push(newY);
      });
    }
    data = [settings, rooms];
    res.render("weeks", 
      {
        data,
        helpers: { json: function (c) { return JSON.stringify(c); },
      },
    });
  });
});

app.get("/generateWeekly", (_req, res) => {
  res.render("generateIterative");
});

// app.get("/getWeeklySetup/:setupId", (req, res) => {
//   let setupId = req.params.setupId;
//   fs.readFile("./weeklySetups/"+setupId+".json", 'utf8', (err, data) => {
//     if(err) throw err;
//     res.json(data);
//   });
// }); 

app.get("/unityGetCurrentWeek/:output_id", (req, res) => {
  fs.readFile("./outputs/"+req.params.output_id+".json", 'utf8', (err, data) => {
    let sim = JSON.parse(data);
    let settings = sim[0];
    let weekNum = settings.weekNum;
    //console.log(settings.weekNum);  
    res.json([weekNum]);
  });
  
});

app.post("/generateIterative", (req, res) => {
  console.log("/generativeIterative", req.body);
  let outputId = req.body.outputId;
  let roomGoals = JSON.parse(req.body.roomGoals);

  // Rewrite new goals
  fs.readFile("./outputs/"+outputId+".json", 'utf8', (err, data) => {
    let sim = JSON.parse(data);
    let rooms = sim[1];
    if(roomGoals.length > 0) { 
      rooms.forEach((room) => {
        roomGoalObj = roomGoals.filter(roomGoal => room.room_id == roomGoal.room_id)[0];
        if(roomGoalObj) {
          room.weekly.goals[room.weekly.goals.length-1] = parseInt(roomGoalObj.goal);
        }
      });
    }
    fs.writeFile("./outputs/"+outputId+".json", JSON.stringify(sim),
      (err, data) => {
      if(err) throw err;
      if(roomGoals.length > 0) { 
        console.log(">  Wrote goals to ./outputs/"+outputId+".json");
      }
    });
  });

  // Run the generation script
  runScript("./generateIterative.js", [outputId], function(err) {
    if(err) {
      res.json({"done" : false})
      throw err;
    } else {
      res.json({"done" : true});
    }
  });

});

app.post("/unityGenerateIterative", (req, res) => {
  console.log("/unityGenerativeIterative", req.body);
  let roomGoals = [];
  outputId = req.body.output_id;
  Object.keys(req.body).forEach((key) => {
    if(key !== "output_id" ) {
      if(req.body[key] == "") { // improve null data handling
        req.body[key] = 0; // set to total consumption
      }
      roomGoals.push({ 
          "room_id" : key, 
          "goal" : parseInt(req.body[key])
        });
    }
  });
  console.log(roomGoals);
  // Change goals
  fs.readFile("./outputs/"+outputId+".json", 'utf8', (err, data) => {
    let sim = JSON.parse(data);
    let rooms = sim[1];
    
    if(roomGoals.length > 0) { 
      rooms.forEach((room) => {
        roomGoalObj = roomGoals.filter(roomGoal => room.room_id == roomGoal.room_id)[0];
        if(roomGoalObj) {
          room.weekly.goals[room.weekly.goals.length-1] = parseInt(roomGoalObj.goal);
        }
      });
    }
    fs.writeFile("./outputs/"+outputId+".json", JSON.stringify(sim),
      (err, data) => {
      if(err) throw err;
      if(roomGoals.length > 0) { 
        console.log(">  Wrote goals to ./outputs/"+outputId+".json");
      }
    });
  });

  runScript("./generateIterative.js", [outputId], function(err) {
    if(err) {
      res.json({"done" : false})
      throw err;
    } else {
      res.json({"done" : true});
    }
  });

});

// Chunk function:
// --------------- 
Object.defineProperty(Array.prototype, "chunk", {
  value: function (chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  },
});

app.get('/unityDaily/:outputId', (req, res) => {
  let outputId = req.params.outputId;
  fs.readFile("./dailyOutputs/"+outputId+"_daily.json", "utf8", 
  (err, data) => {
    if(err) throw err;
    res.json(JSON.parse(data));
  });
});

// Child process runScript script:
// -------------------------------
var childProcess = require("child_process");

function runScript(scriptPath, child_argv, callback) {
  // keep track of whether callback has been invoked to prevent multiple invocations
  var invoked = false;
  var process = childProcess.fork(scriptPath, child_argv);
  // listen for errors as they may prevent the exit event from firing
  process.on("error", function (err) {
    if (invoked) return;
    invoked = true;
    callback(err);
  });
  // execute the callback once the process has finished running
  process.on("exit", function (code) {
    if (invoked) return;
    invoked = true;
    var err = code === 0 ? null : new Error("exit code " + code);
    callback(err);
  });
}