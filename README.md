# About

EnergySim is an agent-based iterative electricty usage simulator. The code has an Agent class and an Appliance class, which interact to generate the data. The agent has a watchfulness value for each room of the house, which can be affected
by setting consumption goals. 

This project was created to be used by a project by Irem Sismanturk, Master's candidate at Simon Fraser University's Interactive Arts and Technology program. Irem's project is a "Smart Mirror" which shows a person how much electricy they are using by way of "units" (pieces of wood which slide in and out on frame of the mirror).

The code was also made to interact with Unity for the purposes of the project.

# Project structure 

node.js, express, express-handlebars

- server.js runs with node on port 3000
- /views folder contains front-end files for user interface in JSON format
- /setups contains the setups generated from user-interface in JSON format
- /outputs contains the raw output files
- globals.js contains:
- - the minimum and maximum amount that watchfulness changes by
- helpers.js contins a few helpful functions 
- Agent.js 
- Appliance.js

# Installation

- Clone the repository into a folder
- From command line, run: 
``` 
npm install 
```
- Then you can launch the user inteface on port 3000 by running
```
npm run server
```
- Open the browser and type localhost:3000 in the address bar

# User interface

# # Setup view 

![setup view](https://github.com/nicktchernikov/energysim/blog/master/documentation/images/setup.PNG?raw=true)


# # Generate view

![generate view](https://github.com/nicktchernikov/energysim/master/documentation/images/generate.PNG?raw=true)

# # Results view

![generate view](https://github.com/nicktchernikov/energysim/master/documentation/images/results-2.PNG?raw=true)
