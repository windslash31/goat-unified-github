const db = require('../config/db');

const getAllApplications = async () => {
    const result = await db.query('SELECT id, name FROM internal_applications ORDER BY name');
    return result.rows;
};

module.exports = {
    getAllApplications,
};