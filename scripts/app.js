// Entry point for the application

// express application
const express = require("express");

const path = require("path");

// require the controller we make
const server = require("./server");

const app = express();

// view engine + views path
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// needed to process data from HTML form POST req
app.use(express.urlencoded({ extended: true }));

// static file serving
app.use(express.static(path.join(__dirname, "..")));

// routes
server(app);

// port (supports deployment)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening port ${PORT}`));