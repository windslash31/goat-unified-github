const { fetchData } = require("../../utils/dbHelpers");

const getGoogleUsersData = async (req, res, next) => {
  try {
    const query = {
      google_users: "SELECT * FROM gws_users;",
    };
    const data = await fetchData(query);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Google data:", error);
    next(error);
  }
};

module.exports = {
  getGoogleUsersData,
};
