const { fetchData } = require("../../utils/dbHelpers");
const db = require("../../config/db");

const getJumpCloudUsersData = async (req, res, next) => {
  try {
    const queries = {
      jumpcloud_users: "SELECT * FROM jumpcloud_users ORDER BY email;",
    };
    const data = await fetchData(queries);
    res.json(data);
  } catch (error) {
    console.error("Error fetching JumpCloud users data:", error);
    next(error);
  }
};

const getJumpCloudLogsData = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1000;
    const offset = (page - 1) * limit;

    const totalResult = await db.query("SELECT COUNT(*) FROM jumpcloud_logs");
    const totalRecords = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    const logsResult = await db.query(
      "SELECT * FROM jumpcloud_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    res.json({
      pagination: {
        total_records: totalRecords,
        total_pages: totalPages,
        current_page: page,
        limit: limit,
      },
      jumpcloud_logs: logsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching JumpCloud logs data:", error);
    next(error);
  }
};

module.exports = {
  getJumpCloudUsersData,
  getJumpCloudLogsData,
};
