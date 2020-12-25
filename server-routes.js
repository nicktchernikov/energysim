const express = require('express');
const app = express();

const routes = require('./routes');

app.use('/', routes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log("Server is running on Port " + PORT);
});