# Current simulation model operation

User creates a setup with the following parameters: 

    Rooms
    Appliances in those rooms 
    An initial watchfulness value (0.0 to 1.0)
    Days to simulate (0 to No Limit)

The program then runs through each appliance, essentially generating random data
with the one caveat being that the watchfulness value affects (1) when an
appliance is triggered to be turned on by the following function: 


    if(Math.rand() > 0.95) { 
        agent.changeApplianceState(appliance)
    }

    changeApplianceState(appliance) then does the following: 

    if(Math.rand() > watchfulness) {
        appliance.turnOn()
    }

The goals are calculated by subtracting a set percentage from the current 
week's goal. 

# Proposed new model 

The goal of the project is to show the effect of having sliders show 
the consumption/goal ratio of particular rooms or appliances to a user. 

Rather than generate the entire simluation at once, the following should happen: 

(1) User provides setup
(2) Setup is loaded into Unity as JSON
*Set some limits for rows so that later on the Unity code looks good/less tinkering is required.
(3) Node backend generates the 1st week of data 
(4) Unity code receives the JSON for the 1st week of data
(5) Data for 1st week is displayed visually
*Data includes: Rooms, Appliances, Goal, Consumption, and the Slider value
Importantly, the slider values are displayed on the mirror object.
(6)

 # TODO: 

 After 1 week, we want to output daily totals for each room
 e.g. 
 Room 1 
 Day 1: 1201
 Day 2: 4214
 Day 3: 2310
 Day 4: 3901
 ... and so on 
 Room 2: 
 Day 1: 1312
 Day 2: 9401
 .. you get the idea

 We also want to append this data to the 
 total file 

 Metadata: 
 * which appliances are on or off
 * initial timestamp
 * increment 
 * agent watchfulness 

 and then for the user to be able to click a button on the front 
 end which generates the next weeks' data based on what goal values 
 the user selected for the following week

 Figure out how daily total values fit into this
 Figure out how to calculate average 
 - weekly average
 - monthly average 

 After a week of data generation, we want to output the following data: 
 room1  
 - goal
 - consumption 
 - slider value
 - appliances:
/ [ 1, 2, ... n ]
 room 2 
/ ...
 room n 

 Along with the metadata
 - Week number 

 # What actually needs to happen? 

 User clicks generate and it generates only 1 week of data
 is then prompted to provide the goal for next week 

Need to 