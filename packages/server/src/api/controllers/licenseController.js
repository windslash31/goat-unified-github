const licenseService = require("../../services/licenseService");
const db = require("../../config/db");

const getAppLicenses = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const licenses = await licenseService.getLicensesForApplication(appId);
    res.json(licenses);
  } catch (error) {
    next(error);
  }
};

const addAppLicense = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const licenseData = req.body;
    const newLicense = await licenseService.addLicenseToApplication(
      appId,
      licenseData
    );
    res.status(201).json(newLicense);
  } catch (error) {
    next(error);
  }
};

const assignLicense = async (req, res, next) => {
  try {
    const { employeeId, applicationId, tierName } = req.body;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await licenseService.assignLicenseToEmployee(
      employeeId,
      applicationId,
      tierName,
      actorId,
      reqContext
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// --- ADD NEW FUNCTION ---
const removeAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const result = await licenseService.removeLicenseAssignment(
      assignmentId,
      actorId,
      reqContext
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const assignLicenseFromAPI = async (req, res, next) => {
  try {
    // tierName is now optional
    const { employeeEmail, applicationName, tierName } = req.body;
    const actorId = req.user.id; // The user associated with the API key
    const reqContext = { ip: req.ip, userAgent: req.get("User-Agent") };

    const empRes = await db.query(
      "SELECT id FROM employees WHERE employee_email = $1",
      [employeeEmail]
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found." });
    }
    const employeeId = empRes.rows[0].id;

    const appRes = await db.query(
      "SELECT id FROM managed_applications WHERE name = $1",
      [applicationName]
    );
    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: "Application not found." });
    }
    const applicationId = appRes.rows[0].id;

    const result = await licenseService.assignLicenseToEmployee(
      employeeId,
      applicationId,
      tierName,
      actorId,
      reqContext
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppLicenses,
  addAppLicense,
  assignLicense,
  removeAssignment,
  assignLicenseFromAPI,
};
