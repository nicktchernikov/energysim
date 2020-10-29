var t = 0;      
var timesteps = 10;

function iterate() {        
  setTimeout(function() {   
    
    if(t != 0 && t % 96 == 0) { 
        // Runs every 1 day
    } 
    rooms.forEach((room) => {
        room.appliances.forEach((appliance) => {
            let appliance_id = appliance.appliance_id;
            // Get appliance object: 
            let appliance_object = appliance_objects.filter(obj => { return obj.id === appliance_id;});            
            appliance_object = appliance_object[0];

            // ...  *DO INTERACTIONS HERE* ... // 
            
            // Time-based increases/decreases in motives
            person.energy -= 0.01;

            // When finished interactions, get the current watt output of appliance
            let watts = appliance_object.outputWatts; 
            console.log("appliance_object.state: " + appliance_object.state + ", watts: " + watts);

            // Add values
            appliance.data[0].x.push(t); // timestep
            appliance.data[0].y.push(watts); // watts
        });
    });

    t++;                    
    if (t < timesteps) {
        iterate();             
    }                     
  }, 1000)
}
iterate();                   