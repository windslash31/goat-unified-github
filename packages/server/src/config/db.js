const { Pool } = require('pg');

// --- DIAGNOSTIC LINE ---
// This will show us exactly what password value is being used.
console.log('Attempting to connect with DB_PASSWORD:', process.env.DB_PASSWORD);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// A helper function to make single queries
const query = (text, params) => pool.query(text, params);

module.exports = {
    pool,
    query,
};