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

module.exports = {
  getAppLicenses,
  addAppLicense,
};
