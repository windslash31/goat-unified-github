const {
  getActivityLogs,
  getActivityLogFilterOptions,
  generateAdminActivityReport,
} = require("../../services/logService");
const { Parser } = require("json2csv");

const listActivityLogs = async (req, res, next) => {
  try {
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
    const logs = await getActivityLogs(1000);

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

const getAdminActivityReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const formatMap = {
      pdf: { contentType: "application/pdf", extension: "pdf" },
      excel: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
      },
      csv: { contentType: "text/csv", extension: "csv" },
    };

    const selectedFormat = formatMap[format];
    if (!selectedFormat) {
      return res.status(400).json({ message: "Invalid format requested." });
    }

    const filename = `Admin-Activity-Report-${
      new Date().toISOString().split("T")[0]
    }.${selectedFormat.extension}`;
    res.setHeader("Content-Type", selectedFormat.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await generateAdminActivityReport(format, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listActivityLogs,
  exportActivityLogs,
  getLogFilterOptions,
  getAdminActivityReport,
};
