const applicationService = require("../../services/applicationService");

const listAllApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getAllApplications();
    res.json(applications);
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
    const updatedApplication = await applicationService.updateApplication(
      id,
      name
    );
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

module.exports = {
  listAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
};
