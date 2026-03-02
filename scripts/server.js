// Server logic and route setup
const path = require("path");
module.exports = function (app) {
  // Serve survey.html as a static file
  app.get("/survey", function (req, res) {
    res.sendFile(path.join(__dirname, "../views/survey.html"));
  });

  // Analyst view (using EJS)
  app.get("/results", function (req, res) {
    res.render("results");
  });
};
