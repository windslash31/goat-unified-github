// packages/server/src/config/db.js
const { Pool } = require("pg");
const config = require("./config"); // Import the new config

const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

// A helper function to make single queries
const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
