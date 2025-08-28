const db = require("../config/db");

const fetchData = async (queries) => {
  const client = await db.pool.connect();
  try {
    const results = await Promise.all(
      Object.values(queries).map((query) => client.query(query))
    );
    return Object.keys(queries).reduce((acc, key, index) => {
      acc[key] = results[index].rows;
      return acc;
    }, {});
  } finally {
    client.release();
  }
};

module.exports = {
  fetchData,
};
