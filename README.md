# About

EnergySim is an agent-based iterative electricty usage simulator. The code has an Agent class and an Appliance class, which interact to generate the data. The agent has a watchfulness value for each room of the house, which can be affected
by setting consumption goals. 

This project was created to be used by a project by Irem Sismanturk, Master's candidate at Simon Fraser University's Interactive Arts and Technology program. 

Irem's project is a "Smart Mirror" which shows a person how much electricy they are using by way of "units" (pieces of wood which slide in and out on frame of the mirror).

The code was also made to interact with Unity for the purposes of the project.

# Project structure 

Project is in node.js, express, and express-handlebars

- server.js runs with node on port 3000
- /views folder contains front-end files for user interface in JSON format
- /setups contains the setups generated from user-interface in JSON format
- /outputs contains the raw output files
- globals.js contains:
  - the minimum and maximum amount that watchfulness changes by
- helpers.js contins a few helpful functions 
- Agent.js 
- Appliance.js

# Installation

Prerequisites: have Node.js and NPM package manager installed

- Clone or unzip the repository into a folder
- Navigate to the folder
- From the command line/terminal, run: 
``` 
npm install 
```
- Then you can launch the user inteface on port 3000 by running
```
npm run server
```
- Open a browser and type localhost:3000 in the address bar
- You should see the Setup view as pictured below

# User interface

- Setup view 

![setup view](https://raw.githubusercontent.com/nicktchernikov/energysim/master/documentation/images/setup.PNG?raw=true)


- Generate view

![generate view](https://raw.githubusercontent.com/nicktchernikov/energysim/master/documentation/images/generate.PNG?raw=true)

- Results view

![generate view](https://raw.githubusercontent.com/nicktchernikov/energysim/master/documentation/images/results-2.PNG?raw=true)

# Editing available rooms and appliances

- Rooms

Line 174 of /views/index.handlebars

```
      // Get room types 
      let roomTypes = [
        'bathroom', 'laundry room', 'bedroom', 
        'living room', 'kitchen', 'basement'
      ];
```

- Appliances

/applianceInits.js

example:

``` 	
{
    type : 'fridge',
    watts1 : 200,
    watts2 : 25, 
    min: false,
    max: false,
    motive: 'hunger',
    alwaysOn: true,
},
```

Currently available motives are:

hunger, light, boredom, cleanliness, comfort)
