function condense(rooms) { // 15-minute timesteps to 1 hour totals
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
                if ((y_index + 1) % 4 == 0) {
                    new_x.push(x);
                    new_y.push(y_sum);
                    y_sum = 0;
                    x++;
                }
            }
            rooms[i].appliances[j].data[0].y = new_y;
            rooms[i].appliances[j].layout = {title: rooms[i].appliances[j].appliance_id + " in " + rooms[i].room_id, xaxis: { title: "time (hours)" }, yaxis: { title: "watts" },};
        }
    }
    return rooms;
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function convertRange( value, r1, r2 ) { 
    return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}

module.exports = { condense, getRandomInt, convertRange }