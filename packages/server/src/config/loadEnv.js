const path = require('path');

// --- FIX: Correct the path to go up three levels to the monorepo root ---
const envPath = path.resolve(__dirname, '../../../../.env');

console.log(`Loading environment variables from: ${envPath}`);

require('dotenv').config({ path: envPath });