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
    const { cost, tier } = req.body;
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    if (cost === undefined || isNaN(parseFloat(cost))) {
      return res.status(400).json({ message: "A valid cost is required." });
    }

    const updatedLicense = await licenseService.updateLicenseCost(
      parseInt(applicationId, 10),
      parseFloat(cost),
      tier,
      actorId,
      reqContext
    );

    res.json(updatedLicense);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLicenses,
  updateCost,
};
