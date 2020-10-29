// Testing Plotly

let apiKey = "grCLiStC9vm8xQMNJRwt";

var plotly = require('plotly')("ntcherni", apiKey);

var data = [{x:[0,1,2], y:[3,2,1], type: 'bar'}];
var layout = {fileopt : "overwrite", filename : "simple-node-example"};

plotly.plot(data, layout, function (err, msg) {
	if (err) return console.log(err);
	console.log(msg);
});


