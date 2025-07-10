const {
  getActivityLogs,
  getActivityLogFilterOptions,
} = require("../../services/logService");
const { Parser } = require("json2csv");

const listActivityLogs = async (req, res, next) => {
  try {
    // Pass query params as filters
    const logs = await getActivityLogs(req.query);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

const getLogFilterOptions = async (req, res, next) => {
  try {
    const options = await getActivityLogFilterOptions();
    res.json(options);
  } catch (error) {
    next(error);
  }
};

const exportActivityLogs = async (req, res, next) => {
  try {
    const logs = await getActivityLogs(1000); // Export up to 1000 logs

    const fields = [
      "timestamp",
      "action_type",
      "actor_email",
      "target_employee_email",
      "target_user_email",
      "details",
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(logs);

    res.header("Content-Type", "text/csv");
    res.attachment("activity-log.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listActivityLogs,
  exportActivityLogs,
  getLogFilterOptions,
};
