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
    // FIX 1: Correctly read `total_seats` from the request body.
    const { cost, total_seats, tier } = req.body;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    if (cost === undefined || isNaN(parseFloat(cost))) {
      return res.status(400).json({ message: "A valid cost is required." });
    }

    // FIX 2: Pass all arguments in the correct order to the service.
    const updatedLicense = await licenseService.updateLicenseCost(
      parseInt(applicationId, 10),
      parseFloat(cost),
      total_seats !== undefined ? parseInt(total_seats, 10) : null, // Pass total_seats
      tier, // Pass the tier
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

module.exports = {
  getLicenses,
  updateCost,
  getApplicationAssignments,
};
