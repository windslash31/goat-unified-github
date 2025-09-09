const applicationService = require("../../services/applicationService");

const listAllApplications = async (req, res, next) => {
  try {
    // Pass the query parameters to the service
    const applications = await applicationService.getAllManagedApplications(
      req.query
    );
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

const onboardApplication = async (req, res, next) => {
  try {
    const appData = req.body;
    const newApplication = await applicationService.onboardApplication(appData);
    res.status(201).json(newApplication);
  } catch (error) {
    next(error);
  }
};

const createApplication = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Application name is required." });
    }
    const newApplication = await applicationService.createApplication(name);
    res.status(201).json(newApplication);
  } catch (error) {
    next(error);
  }
};

const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Application name is required." });
    }
    // This now calls the correct function for the 'managed_applications' table
    const updatedApplication =
      await applicationService.updateManagedApplication(id, name);
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await applicationService.deleteApplication(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const setLicensableStatus = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { is_licensable } = req.body;
    const updatedApp = await applicationService.setApplicationLicensableStatus(
      appId,
      is_licensable
    );
    res.json(updatedApp);
  } catch (error) {
    next(error);
  }
};

const listApplicationNames = async (req, res, next) => {
  try {
    const appNames = await applicationService.getManagedApplicationNames();
    res.json(appNames);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  onboardApplication,
  setLicensableStatus,
  listApplicationNames,
};
