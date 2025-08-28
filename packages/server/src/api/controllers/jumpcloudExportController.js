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

module.exports = {
  getJumpCloudUsersData,
};
