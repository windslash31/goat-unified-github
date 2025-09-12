const path = require("path");

const envPath = path.resolve(__dirname, "../../.env.server");

require("dotenv").config({ path: envPath });
