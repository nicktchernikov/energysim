await = require('async');

function timer(ms) {
    return new Promise(res => setTimeout(res, ms));
}

for (var i = 0; i < myArray.length; i++){
    console.log(myArray[i]);
    await timer(500);
}