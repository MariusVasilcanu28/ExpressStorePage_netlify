const serverless = require("serverless-http");
const app = require("../../app"); // Import the app.js file

module.exports.handler = serverless(app);
