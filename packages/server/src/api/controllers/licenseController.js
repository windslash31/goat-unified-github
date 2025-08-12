const licenseService = require("../../services/licenseService");

const getLicenses = async (req, res, next) => {
  try {
    const data = await licenseService.getLicenseData();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const updateCost = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    if (req.body.cost === undefined || isNaN(parseFloat(req.body.cost))) {
      return res.status(400).json({ message: "A valid cost is required." });
    }

    const updatedLicense = await licenseService.updateLicenseCost(
      parseInt(applicationId, 10),
      req.body, // Pass the entire body
      actorId,
      reqContext
    );

    res.json(updatedLicense);
  } catch (error) {
    next(error);
  }
};

const getApplicationAssignments = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const assignments = await licenseService.getAssignmentsForApplication(
      parseInt(applicationId, 10)
    );
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

const createAssignmentByName = async (req, res, next) => {
  try {
    const { applicationName, principalIdentifier, principalType } = req.body;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    const newAssignment = await assignmentService.addAssignmentByName(
      { applicationName, principalIdentifier, principalType },
      actorId,
      reqContext
    );
    res.status(201).json(newAssignment);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getLicenses,
  updateCost,
  getApplicationAssignments,
  createAssignmentByName,
};
