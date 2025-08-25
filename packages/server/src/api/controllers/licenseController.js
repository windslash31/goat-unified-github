const licenseService = require("../../services/licenseService");

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

module.exports = {
  getAppLicenses,
  addAppLicense,
  assignLicense,
  removeAssignment,
};
