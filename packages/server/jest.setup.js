// packages/server/jest.setup.js
const path = require("path");

// Load environment variables from the root .env file for the test environment
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env.server"),
});
