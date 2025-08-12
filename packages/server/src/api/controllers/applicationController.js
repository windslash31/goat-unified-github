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
    if (!req.body.name || !req.body.type) {
      return res
        .status(400)
        .json({ message: "Application name and type are required." });
    }
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const newApplication = await applicationService.createApplication(
      req.body,
      actorId,
      reqContext
    );
    res.status(201).json(newApplication);
  } catch (error) {
    next(error);
  }
};

const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.body.name || !req.body.type) {
      return res
        .status(400)
        .json({ message: "Application name and type are required." });
    }
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    const updatedApplication = await applicationService.updateApplication(
      id,
      req.body,
      actorId,
      reqContext
    );
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };
    await applicationService.deleteApplication(id, actorId, reqContext);
    res.status(204).send();
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
