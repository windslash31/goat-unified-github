// packages/server/src/config/loadEnv.js
const path = require("path");

// Go up three levels to the monorepo root to find the .env file
const envPath = path.resolve(__dirname, "../../../../.env");

require("dotenv").config({ path: envPath });
