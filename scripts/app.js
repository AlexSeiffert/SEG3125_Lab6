// Entry point for the application

// express application
var express = require("express");
// require the controller we make
var server = require("./server");

var app = express();

// set up template engine
app.set("view engine", "ejs");

// needed to process data from HTML form POST req
app.use(express.urlencoded({ extended: true }));

// static file serving
app.use(express.static("./public"));

// fire function from server
server(app);

// listen to port
app.listen(3000);
console.log("listening port 3000");
