const path = require("path");
const fs = require("fs");

const express = require("express");
var exphbs = require("express-handlebars");
const app = express();
app.use(express.static("views"));

// Handelebars
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log("Running server on port 5002.");
});

const sessionSettings = {
  days: 7,
  watchfulness: 0.5,
  effect: false
};
const sessionHouse = [];

// Load appliance data:
const applianceInits = require("./applianceInits.js");
app.get("/appliance-data.js", (req, res) => {
  fs.readFile("./applianceInits.js", (err, data) => {
    res.json(applianceInits);
  });
});

app.get('/applianceInits', (req,res) => {
  res.json(applianceInits);
});

app.get("/", (req, res) => {
  //res.json({ msg: 'msg' });
  //res.json({sessionHouse, settings});
  //console.log(sessionSettings);
  res.render("index", {
    sessionHouse: sessionHouse,
    sessionSettings: sessionSettings,
  });
});

app.post('/setSessionSetupId', (req, res) => {
  let setupId = req.body.setupId;
  sessionSettings.setupId = setupId;
  res.status(200).send();
});

app.get('/getSessionSettings', (req, res) => {
  res.json(sessionSettings);
});

app.post('/setupExists', (req, res) => {
  let setupId = req.body.setupId;
  fs.readdir('./setups', (err, filenames) => {
    result = false;
    if(err) throw err;
    filenames.forEach(filename => {
      if(setupId+'.json' == filename) {
        result = true;
      }
    });
    res.json({'exists' : result});
  });
});

app.post('/setSetupSessionWithSetupId', (req, res) => {
  let setupId = req.body.setupId;
  fs.readFile('./setups/'+setupId+'.json', 'utf8', (err, data) => {
    if(err) throw err;
    json = JSON.parse(data);
    settings = json[0].settings[0];
    rooms = json[1].rooms;
    Object.assign(sessionSettings, settings);
    sessionHouse.splice(0, sessionHouse.length);
    rooms.forEach(room => {sessionHouse.push(room);});    
  });
  res.status(200).send();
});

app.get('/load', (req, res) => {
  res.json(sessionHouse);
});

app.get("/newIndex", (req, res) => {
  //res.json({ msg: 'msg' });
  //res.json({sessionHouse, settings});
  //console.log(sessionSettings);
  res.render("newIndex", {
    sessionHouse: sessionHouse,
    sessionSettings: sessionSettings,
    helpers: {
      json: function (context) {
        return JSON.stringify(context);
      },
    },
  });
});

app.get("/*.json", (req, res) => {
  //let filepath = path.join("./", "test.json");
  //console.log(req.url);
  const json = require("./" + req.url);
  res.json(json);
});

// empty array
app.get("/empty", (req, res) => {
  sessionHouse.splice(0, sessionHouse.length);
  res.json(sessionHouse);
});

app.post('/set', (req, res) => {
  let rooms = req.body;
  sessionHouse.splice(0, sessionHouse.length);
  res.status(200).send();
});

// view sessionHouse array
app.get("/view", (req, res) => {
  console.log(sessionHouse);
  res.json(sessionHouse);
});

// add a room to the sessionHouse
app.post("/add-room", (req, res) => {
  name = req.body.name;
  name = name.replace(" ", "_");
  room = { room_id: name, appliances: [] };
  sessionHouse.push(room);
  //console.log('Added ' + name);
  res.status(200).send();
});

// add an appliance to a room
app.post("/add-appliance", (req, res) => {
  let room_id = req.body.room_id;
  let appliance_id = req.body.appliance_id;
  console.log(room_id, appliance_id);
  let i = 0;
  sessionHouse.forEach((room) => {
    if (room.room_id == room_id) {
      //console.log('adding ' + appliance_id);
      sessionHouse[i].appliances.push({ appliance_id: appliance_id });
      console.log('Added');
    }
    i++;
  });
  res.status(200).send();
});

app.get("/setups", (req, res) => {
  fs.readdir("./setups", (err, files) => {
    if (err) {
      res.json();
    } else {
      res.json(files);
    }
  });
});

app.get("/outputs", (req, res) => {
  fs.readdir("./outputs", (err, files) => {
    if (err) {
      res.json(err);
    } else {
      res.json(files);
    }
  });
});

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

app.post("/remove-room", (req, res) => {
  console.log(req.body);
  roomId = req.body.room_id;
  for (i = 0; i < sessionHouse.length; i++) {
    if (sessionHouse[i].room_id == roomId) {
      sessionHouse.splice(i, 1);
    }
  }
  res.status(200).send();
});

app.post("/setsessionHouse", (req, res) => {
  res.json(req.body);
});

app.post("/save", (req, res) => {
  settings = [];
  settings.push(req.body);
  rooms = sessionHouse;
  noAppliances = true;
  rooms.forEach((room) => {
    if (room.appliances.length > 0) {
      noAppliances = false;
    }
  });
  //console.log(noAppliances);
  if (noAppliances == true) {
    res.json({ error: "no appliances" });
    return;
  }
  data = [];
  data.push({ settings });
  data.push({ rooms });
  let json = JSON.stringify(data, null, 4);
  fs.writeFile("./setups/" + req.body.setupId + ".json", json, (err) => {
    if (err) throw err;
    console.log("Wrote setup data to /setups/" + req.body.setupId + ".json!");
    res.json({ saved: true });
  });
});

app.post("/setDays", (req, res) => {
  sessionSettings.days = req.body.newDays;
  res.status(200).end();
});

app.post("/setWatchfulness", (req, res) => {
  sessionSettings.watchfulness = parseFloat(req.body.newWatchfulness);
  res.status(200).end();
});

app.post("/checkSetup", (req, res) => {
  chkId = req.body.setupId;
  //console.log(chkId);
  fs.readdir("./setups", (err, files) => {
    match = false;
    files.forEach((file) => {
      if (file.split(".")[0] == chkId) {
        match = true;
      }
    });
    res.json({ setupId: chkId, exists: match });
  });
});

app.get("/results/:results_filename_id/:type?", (req, res) => {
  filenames = fs.readdirSync(path.join(__dirname, "outputs"));
  results_filename = req.params.results_filename_id + ".json";
  type = req.params.type;

  //console.log('results_filename: ' + results_filename);

  fs.readFile(
    path.join(__dirname, "outputs", results_filename),
    (err, data) => {
      if (err) {
        dataset = []; // empty dataset because of an error

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
        const json_data = JSON.parse(data);

        let settings = json_data[0];
        let rooms = json_data[1];

        // you can do stuff with rooms/settings here ...

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

// without params
app.get("/results", (req, res) => {
  filenames = fs.readdirSync(path.join(__dirname, "outputs"));
  filename = filenames[0]; // Choose first filename in list

  fs.readFile(path.join(__dirname, "outputs", filename), (err, data) => {
    //fs.readFile('./output_data.json', (err, data) => {
    if (err) throw err;
    const dataset = JSON.parse(data);
    let foldername = path.join(__dirname, "outputs");
    var filenames = fs.readdirSync(foldername);
    res.render("results", {
      dataset,
      filenames,
      helpers: {
        json: function (context) {
          return JSON.stringify(context);
        },
      },
    });
  });
});

app.get("/generate/:setupId", (req, res) => {
  let setupId = req.params.setupId;
  if(!setupId) throw "No setupId provided.";

  // Now we can run a script and invoke a callback when complete, e.g.
  runScript("./generate-new.js", [setupId, true], function (err) {
    if (err) throw err;
    console.log("Generate script 1 finished!");
  });

  runScript("./generate-new.js", [setupId, false], function (err) {
    if (err) throw err;
    console.log("Generate script 2 finished!");
  });

  res.json("Running scripts!");
});

app.get("/jsonResults(/:id)?", (req, res) => {
  fileId = req.params.id;
  console.log(fileId);
  if (!fileId) {
    console.log("No id");
    fs.readdir("./outputs", (err, files) => {
      if (err) throw err;
      console.log(files);
    });
  }
  let json = null;
  fs.readdir("outputs", function (err, files) {
    if (err) throw err;
    match = false;
    files.forEach(function (filename) {
      id = filename.split(".")[0];
      if (id == fileId) {
        match = true;
        json = fs.readFileSync("./outputs/" + filename, "utf8");
        json = JSON.parse(json);
        res.json(json);
      }
    });
    if (!match) {
      res.json({ result: "no matching id" });
    }
  });
});

app.get("/getSetupJSON/:setupId", (req, res) => {
  setupId = req.params.setupId;
  fs.readFile("./setups/" + setupId + ".json", "utf8", (err, data) => {
    if (err) {
      res.json({err});
    } else {
      res.json(JSON.parse(data));
    }
  });
});

function getData(outputId, callback) {
  ///console.log(outputId);
  fs.readFile("./outputs/"+outputId+".json", "utf8", (err, data) => {
    callback(JSON.parse(data));
  });
}

app.get("/weekly/:outputId", (req, res) => {
  getData(req.params.outputId, (data) => {
    if(!data) { res.json({"status" : false}); }
    //console.log(data);
    let settings = data[0];
    let rooms = data[1];
    rooms.forEach((room) => {
      room.appliances.forEach((appliance) => {
        //console.log(appliance);
        let y = appliance.data[0].y;
        //console.log(appliance, y);
        appliance.data[0].y = y.chunk(168);
      });
      room.totalData = room.totalData[0].y.chunk(168);
    });
    res.status(200).json([settings, rooms]);
  });
});

app.get("/weekly/:outputId/:weekNum", (req, res) => {
  getData(req.params.outputId, (data) => {
    console.log(data);
    let settings = data[0];
    let rooms = data[1];
    rooms.forEach((room) => {
      room.appliances.forEach((appliance) => {
        //console.log(appliance);
        let y = appliance.data[0].y;
        //console.log(appliance, y);
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

app.get("/weeklyResults/:outputId/:weekNum?", (req, res) => {
  getData(req.params.outputId, (data) => {
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
      console.log("weekNum: " + weekNum);
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
