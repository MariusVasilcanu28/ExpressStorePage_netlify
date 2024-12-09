const serverless = require("serverless-http");
const app = require("../../app"); // Adjust this path based on your file structure

// Export the handler
module.exports.handler = serverless(app);
