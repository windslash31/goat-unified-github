const employeeService = require("../../services/employeeService");
const { logActivity } = require("../../services/logService");
const { Parser } = require("json2csv");
const {
  getJiraUserByEmail,
  getAtlassianAccessByAccountId,
} = require("../../services/atlassianService");
const atlassianService = require("../../services/atlassianService");
const googleService = require("../../services/googleService");
const slackService = require("../../services/slackService");
const jumpcloudService = require("../../services/jumpcloudService");
const db = require("../../config/db");

const listEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getEmployees(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const searchEmployeeOptions = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query; // Search term and pagination params
    const data = await employeeService.searchActiveEmployees(
      q,
      parseInt(page),
      parseInt(limit)
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const exportEmployees = async (req, res, next) => {
  try {
    res.header("Content-Type", "text/csv");
    res.attachment("employees.csv");

    const csvStream = employeeService.streamEmployeesForExport(req.query);
    csvStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id, 10);

    if (isNaN(employeeId)) {
      return res.status(400).send({ message: "Invalid employee ID" });
    }

    const employee = await employeeService.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).send({ message: "Employee not found" });
    }

    res.status(200).send(employee);
  } catch (error) {
    console.error("Error in getEmployee:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await employeeService.updateEmployee(
      id,
      req.body,
      req.user.id,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const getPlatformStatuses = async (req, res, next) => {
  try {
    const statuses = await employeeService.getPlatformStatuses(req.params.id);
    res.json(statuses);
  } catch (error) {
    next(error);
  }
};

const getEmployeeOptions = async (req, res, next) => {
  try {
    const tableName = req.params.table || req.params.tableName;
    if (!tableName)
      return res
        .status(400)
        .json({ message: "Table name parameter is missing." });

    const options = await employeeService.getEmployeeOptions(tableName);
    res.json(options);
  } catch (error) {
    next(error);
  }
};

const getUnifiedTimeline = async (req, res, next) => {
  try {
    const events = await employeeService.getUnifiedTimeline(req.params.id);
    res.json(events);
  } catch (error) {
    next(error);
  }
};

const deactivateOnPlatforms = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platforms } = req.body;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await employeeService.deactivateOnPlatforms(
      id,
      platforms,
      req.user.id,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const bulkDeactivateOnPlatforms = async (req, res, next) => {
  try {
    const { employeeIds, platforms } = req.body;
    if (
      !employeeIds ||
      !platforms ||
      !Array.isArray(employeeIds) ||
      !Array.isArray(platforms)
    ) {
      return res.status(400).json({
        message:
          "Invalid request body. `employeeIds` and `platforms` must be arrays.",
      });
    }
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await employeeService.bulkDeactivateOnPlatforms(
      employeeIds,
      platforms,
      req.user.id,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const logEmployeeView = async (req, res, next) => {
  try {
    const { targetEmployeeId } = req.body;
    if (!targetEmployeeId) {
      return res
        .status(400)
        .json({ message: "Target Employee ID is required." });
    }
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    await logActivity(
      req.user.id,
      "EMPLOYEE_PROFILE_VIEW",
      { targetEmployeeId },
      reqContext
    );
    res.status(200).json({ message: "View logged successfully." });
  } catch (error) {
    next(error);
  }
};

const onboardFromTicket = async (req, res, next) => {
  try {
    const reqContext = {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      source: "n8n_onboard_workflow",
    };
    const result = await employeeService.createEmployeeFromTicket(
      req.body,
      req.user.id,
      reqContext
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const offboardFromTicket = async (req, res, next) => {
  try {
    const reqContext = {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      source: "n8n_offboard_workflow",
    };
    const result = await employeeService.updateOffboardingFromTicket(
      req.body,
      req.user.id,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes("Employee not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const createApplicationAccess = async (req, res, next) => {
  try {
    const reqContext = {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      source: "n8n_uar_workflow",
    };
    const result = await employeeService.createApplicationAccess(
      req.body,
      req.user.id,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const getLicenseDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const licenseDetails = await employeeService.getLicenseDetails(id);
    res.json(licenseDetails);
  } catch (error) {
    next(error);
  }
};

const bulkImportEmployees = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const results = await employeeService.bulkImportEmployees(
      req.file.buffer,
      req.user.id,
      reqContext
    );
    res.status(200).json(results);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({
      message:
        error.message || "An unexpected error occurred during the bulk import.",
    });
  }
};

const getEmployeeImportTemplate = (req, res) => {
  const headers = [
    "first_name",
    "last_name",
    "middle_name",
    "employee_email",
    "position_name",
    "position_level",
    "join_date",
    "asset_name",
    "onboarding_ticket",
    "manager_email",
    "legal_entity_name",
    "office_location_name",
    "employee_type_name",
    "employee_sub_type_name",
    "application_access",
  ];
  const csv = headers.join(",");
  res.header("Content-Type", "text/csv");
  res.attachment("employee_import_template.csv");
  res.send(csv);
};

const getPlatformLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platform, ...filters } = req.query;
    if (!platform) {
      return res
        .status(400)
        .json({ message: "A platform query parameter is required." });
    }
    const logs = await employeeService.getPlatformLogsFromDB(
      id,
      platform,
      filters
    );
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

const onboardDeferred = async (req, res, next) => {
  try {
    const employeeData = req.body;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await employeeService.onboardDeferred(
      employeeData,
      req.user.id,
      reqContext
    );
    res.status(202).json(result); // 202 Accepted
  } catch (error) {
    next(error);
  }
};

const reconcileManagers = async (req, res, next) => {
  try {
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await employeeService.reconcileManagers(
      req.user.id,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getEmployeeDevices = async (req, res, next) => {
  try {
    const { id } = req.params;
    const devices = await employeeService.getEmployeeDevices(id);
    res.json(devices);
  } catch (error) {
    next(error);
  }
};

const syncPlatformStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    // --- THIS IS THE NEW "FORCE REFRESH" LOGIC ---
    // It calls the new service function to perform a live sync
    const updatedStatuses = await employeeService.forceSyncPlatformStatus(
      parseInt(id, 10)
    );
    res.json({
      message: "Platform statuses synced successfully.",
      statuses: updatedStatuses,
    });
  } catch (error) {
    if (error.message.includes("Employee not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const triggerPlatformSync = async (req, res, next) => {
  console.log("CRON-TRIGGER: Received request to start platform sync.");
  res
    .status(202)
    .json({ message: "Platform sync job triggered successfully." });

  try {
    // Correctly import the function from the cron file
    const { syncAllUserStatuses } = require("../../cron/platformSync");
    await syncAllUserStatuses(); // Call the correct function
  } catch (error) {
    console.error("CRON-TRIGGER: The triggered sync job failed.", error);
  }
};

const getEmployeeAtlassianAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const atlassianUser = await getJiraUserByEmail(employee.employee_email);
    if (!atlassianUser) {
      return res.json({
        jiraProjects: [],
        bitbucketRepositories: [],
        confluenceSpaces: [],
      });
    }

    const accessDetails = await getAtlassianAccessByAccountId(
      atlassianUser.account_id
    );
    res.json(accessDetails);
  } catch (error) {
    next(error);
  }
};

const getEmployeeApplicationAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accessDetails = await employeeService.getApplicationAccess(
      parseInt(id, 10)
    );
    res.json(accessDetails);
  } catch (error) {
    next(error);
  }
};

const getApplicationAccessDetails = async (req, res, next) => {
  try {
    const { id: employeeId, platformKey } = req.params;
    const employeeEmail = req.employee.employee_email;
    let details;

    // Handle direct platform integrations
    if (platformKey === "google") {
      details = await googleService.getUserStatus(employeeEmail);
    } else if (platformKey === "slack") {
      details = await slackService.getUserStatus(employeeEmail);
    } else if (platformKey === "atlassian") {
      const atlassianUser = await atlassianService.getJiraUserByEmail(
        employeeEmail
      );
      if (!atlassianUser || !atlassianUser.account_id) {
        details = { message: "User not found in Atlassian." };
      } else {
        details = await atlassianService.getAtlassianAccessByAccountId(
          atlassianUser.account_id
        );
      }
    } else if (platformKey === "jumpcloud") {
      details = await jumpcloudService.getUserStatus(employeeEmail);
    } else {
      // Handle other managed applications (like JumpCloud SSO apps)
      const appRes = await db.query(
        "SELECT id, jumpcloud_app_id FROM managed_applications WHERE name = $1",
        [platformKey]
      );

      if (appRes.rows.length > 0 && appRes.rows[0].jumpcloud_app_id) {
        const managedApplicationId = appRes.rows[0].id;
        details = await employeeService.getJumpCloudSsoAppDetails(
          employeeId,
          managedApplicationId
        );
      } else {
        return res
          .status(404)
          .json({ message: "Details not available for this application." });
      }
    }

    res.json(details);
  } catch (error) {
    next(error);
  }
};

const removeProvisionedAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await employeeService.removeUserAccount(
      accountId,
      actorId,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const bulkUpdateEmployees = async (req, res, next) => {
  try {
    const { employeeIds, updateData } = req.body;
    if (
      !employeeIds ||
      !updateData ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return res.status(400).json({
        message:
          "Invalid request body. 'employeeIds' array and 'updateData' object are required.",
      });
    }
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await employeeService.bulkUpdateEmployees(
      employeeIds,
      updateData,
      req.user.id,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEmployees,
  getEmployee,
  updateEmployee,
  onboardFromTicket,
  offboardFromTicket,
  createApplicationAccess,
  logEmployeeView,
  getEmployeeOptions,
  deactivateOnPlatforms,
  bulkDeactivateOnPlatforms,
  getPlatformStatuses,
  getPlatformLogs,
  getUnifiedTimeline,
  exportEmployees,
  getLicenseDetails,
  bulkImportEmployees,
  getEmployeeImportTemplate,
  getEmployeeDevices,
  syncPlatformStatus,
  triggerPlatformSync,
  getEmployeeAtlassianAccess,
  getEmployeeApplicationAccess,
  getApplicationAccessDetails,
  onboardDeferred,
  reconcileManagers,
  removeProvisionedAccount,
  searchEmployeeOptions,
  bulkUpdateEmployees,
};
