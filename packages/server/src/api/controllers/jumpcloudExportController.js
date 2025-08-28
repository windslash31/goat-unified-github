const { fetchData } = require("../../utils/dbHelpers");

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
    const queries = {
      jumpcloud_logs: "SELECT * FROM jumpcloud_logs ORDER BY timestamp DESC;",
    };
    const data = await fetchData(queries);
    res.json(data);
  } catch (error) {
    console.error("Error fetching JumpCloud logs data:", error);
    next(error);
  }
};

module.exports = {
  getJumpCloudUsersData,
  getJumpCloudLogsData,
};
