const path = require('path');
const fs = require('fs');

const express = require('express');
var exphbs  = require('express-handlebars');
const app = express();

var router = express.Router();

const house = [];

// Handelebars
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const PORT = process.env.PORT || 5002;


app.get('/*.json', (req, res) => {
    //let filepath = path.join("./", "test.json");
    //console.log(req.url);
    const json = require("./"+req.url);
    res.json(json);
});

// empty array
app.get('/empty', (req, res) => {
    house.splice(0, house.length)
    res.json(house);
});

// view house array
app.get('/view', (req, res) => {
    res.json(house);
});


// add a room to the house
app.post('/add-room', (req, res) => {
    console.log(req.body);
    let id = Math.floor(1000 + Math.random() * 9000); //random id
    let name = req.body.name + "_" + id;
    name = name.replace(" ", "_");
    room = { "room_id" : name, "appliances" : [] };
    house.push(room);
    res.redirect('/');
    // output json
});

// add an appliance to a room
app.post('/add-appliance', (req, res) => {
    console.log(req.body);
    let type = req.body.selected_type;
    let id = Math.floor(1000 + Math.random() * 9000); //random id
    let type_id = type + "_" + id;
    //console.log(type_id);
    let roomName = req.body.room_id;
    let applianceObject = {appliance_id: type_id};
    console.log(applianceObject);
    let found = false;
    house.forEach((room) => {
        if(room.room_id === roomName) found = true;
    });
    if(!found) {
        res.json({msg: "No such room"});
    } else {
        let i = 0;
        house.forEach((room) => {
            if(room.room_id === roomName) {
                house[i].appliances.push(applianceObject);
            }
            i++;
        });
        res.redirect('/');
    }
});

app.post('/remove-appliance', (req, res) => {
    let room_id = req.body.room_id;
    let appliance_id = req.body.appliance_id;
    console.log(room_id,appliance_id);
    let i = 0;
    house.forEach((room) => {
        if(room.room_id === room_id) {
            let j = 0; 
            room.appliances.forEach((appliance) => {
                if(appliance.appliance_id == appliance_id) { 
                    house[i].appliances.splice(j, 1);
                }
                j++;
            });
        }
        i++;
    });
    res.redirect('/');
});

app.get('/save', (req, res) => {
    // add layout info here? 
    let json = JSON.stringify(house, null, 4);
    fs.writeFile('./setup_data.json', json, (err) => {
        if (err) throw err;
        console.log('Wrote setup data to /setup_data.json!');
        res.json({'success' : 'true'});
    });
});


app.post('/save', (req, res) => {
    settings = [];
    settings.push(req.body);
    rooms = house;
    data = [];
    data.push({settings});
    data.push({rooms});
    let json = JSON.stringify(data, null, 4);
    fs.writeFile('./setup_data.json', json, (err) => {
        if (err) throw err;
        console.log('Wrote setup data!');
        res.json({'success' : 'true'});
    });
});

app.post('/typicalHouse', (req, res) => {
    settings = [];
    settings.push(req.body);

    parsedJSON = require('./typical_house_setup.json');
    rooms = parsedJSON[0].rooms;

    //console.log(parsedJSON, rooms);

    data = [];
    data.push({settings});
    data.push({rooms});
    let json = JSON.stringify(data, null, 4);
    fs.writeFile('./setup_data.json', json, (err) => {
        if (err) throw err;
        console.log('Wrote setup data!');
        res.json({'success' : 'true'});
    });
});

app.get('/checkSetup', (req, res) => {
    fs.readFile('./setup_data.json', (err, data) => {
        if(err) { 
            res.json({'err' : err, 'setupExists' : false});
        } else {
            res.json({'setupExists' : true});
        }
    });
});

app.post('/checkSetup', (req, res) => {
    chkId = req.body.setupId;
    console.log(chkId);
    fs.readdir('./setups', (err, files) => {
        match = false;
        files.forEach((file) => {
            if(file.split(".")[0] == chkId) {
                match = true;
            }
        });
    });
    res.json({"chkId" : chkId, "exists" : match});
});

app.get('/', (req, res) => {
    //res.json({ msg: 'msg' });
    res.render('index', 
        {house: house}
    );
});

app.get('/results/:results_filename_id/:type', (req, res) => {
    filenames = fs.readdirSync(path.join(__dirname, "outputs"));
    results_filename = req.params.results_filename_id + ".json";
    type = req.params.type; 

    console.log('results_filename: ' + results_filename);

    fs.readFile( path.join(__dirname, "outputs", results_filename), (err, data) => {
        if(err) {
            dataset = []; // empty dataset because of an error

            res.render('results', 
                { dataset, filenames,
                    helpers: { 
                        json: function (context) { return JSON.stringify(context); } 
                    }
                }
            );
        } else { 
            const json_data = JSON.parse(data);

            let settings = json_data[0];
            let rooms = json_data[1]; 

            // you can do stuff with rooms/settings here ... 

            if(type == 'total') {
                rooms.forEach((room) => {
                    room.appliances.forEach(
                        (appliance) => {
                            newY = [];
                            sumY = 0;
                            for(i = 0; i < appliance.data[0].y.length; i++ ){
                                sumY += appliance.data[0].y[i];
                                newY.push(sumY);
                            }
                            appliance.data[0].y = newY;
                        }
                    );
                    newY = [];
                    sumY = 0;
                    for(i = 0; i < room.total_data[0].y.length; i++ ){
                        sumY += room.total_data[0].y[i];
                        newY.push(sumY);
                    }
                    room.total_data[0].y = newY;
                });
            } 
     
            let dataset = [];

            dataset.push(settings);
            dataset.push(rooms);

            res.render('results', 
                { dataset, filenames,
                    helpers: { 
                        json: function (context) { return JSON.stringify(context); } 
                    }
                }
            );
        }
    });
});

// without params
app.get('/results', (req, res) => {
    // JSON data set from /generate
    
    //console.log(req['params']);

    filenames = fs.readdirSync(path.join(__dirname, "outputs"));
    filename = filenames[0];

    fs.readFile(path.join(__dirname, "outputs", filename), (err, data) => {
    //fs.readFile('./output_data.json', (err, data) => {
        if(err) throw err;
        const dataset = JSON.parse(data);
        
        let settings = dataset[0];
        let rooms = dataset[1];

        // condendsing data: 
        //rooms = condense_hourly(rooms);
        dataset.push(settings);
        dataset.push(rooms);

        let foldername = path.join(__dirname, 'outputs');
        var filenames = fs.readdirSync(foldername);
        //console.log(condensed_dataset);

        res.render('results', 
            { dataset, filenames,
                helpers: { 
                    json: function (context) { return JSON.stringify(context); } 
                }
            }
        );
    });
});

app.get('/generate', (req, res) => {
    // Now we can run a script and invoke a callback when complete, e.g.
    runScript('./generate-silent.js', function (err) {
        if (err) throw err;
        // code that executes once generation is done... 
        console.log('Generated!');
        res.json({ success: true });
    });
});

const applianceInits = require('./applianceInits.js');
app.get('/appliance-data.js', (req, res) => {
    fs.readFile('./applianceInits.js', (err, data) => {
            res.json(applianceInits);
    });
});

app.get('/jsonResults(/:id)?', (req, res) => {
    fileId = req.params.id;
    console.log(fileId);
    if(!fileId) {
        console.log('No id');
        fs.readdir('./outputs', (err, files) => {
            if(err) throw err;
            console.log(files);
        });
    }
    let json = null;
    fs.readdir('outputs', function(err, files) {
        if(err) throw err;
        match = false;
        files.forEach(function (filename) {
            id = filename.split(".")[0];
            if(id == fileId) {
                match = true;
                json = fs.readFileSync('./outputs/'+filename, 'utf8');
                json = JSON.parse(json);
                res.json(json);
            }
        });
        if (!match) { 
            json = {"result" : "no matching id"};
            res.json(json);
        }
    });
});


app.listen(PORT, () => {
    console.log('Running server on port 5002.');
});

// Child process script:
var childProcess = require('child_process');
const { isRegExp } = require('util');

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}

function condense_hourly(rooms) {
    console.log("Condensing hourly.");
    for(i = 0; i < rooms.length; i++) {    
        let appliances = rooms[i].appliances;
        for(j = 0; j < appliances.length; j++) {
            let appliance_data = appliances[j].data;
            let new_x = [];
            let new_y = [];
            let y_sum = 0;
            let x = 0;
            for(y_i = 0; y_i < appliance_data[0].y.length; y_i++){
                y_sum += appliance_data[0].y[y_i];
                if((y_i+1) % 60 == 0) { 
                    new_x.push(x);
                    new_y.push(y_sum);
                    y_sum = 0;
                    x++;
                }
            }
            //console.log(new_y);
            rooms[i].appliances[j].data[0].y = new_y;
            rooms[i].appliances[j].data[0].x = new_x;
            //console.log( rooms[i].appliances[j].appliance_id );
            rooms[i].appliances[j].layout = {
                "title" : rooms[i].appliances[j].appliance_id + " in " + rooms[i].room_id,
                "xaxis" : {"title" : "time (hours)"}, 
                "yaxis" : {"title" : "joules (watts/sec)"}
            }; 
        }
    }
    //console.log(rooms[0].appliances[0].data);
    return rooms;
}
