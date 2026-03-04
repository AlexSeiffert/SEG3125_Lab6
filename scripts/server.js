// Server logic and route setup
const path = require("path");
const fs = require("fs");


module.exports = function (app) {
  // Serve survey.html as a static file
  app.get("/survey", function (req, res) {
    res.sendFile(path.join(__dirname, "../views/survey.html"));
  });

  app.post("/survey", function (req, res) {
    // Add timestamp to the response data
    const responseData = {
      timestamp: new Date().toISOString(),
      ...req.body
    };

    // Path to the results file
    const resultsFile = path.join(__dirname, "../results/survey-responses.json");

    // Append the JSON data to the file (each entry on a new line)
    fs.appendFile(resultsFile, JSON.stringify(responseData) + "\n", (err) => {
      if (err) {
        console.error("Error saving survey response:", err);
      } else {
        console.log("Survey response saved successfully");
      }
    });

    res.render("results", { responses: req.body });
    console.log("Received survey responses:", req.body);
  });
  // Analyst view (using EJS)
  app.get("/results", function (req, res) {
    res.render("results");
  });
};
