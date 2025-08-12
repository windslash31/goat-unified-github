const assignmentService = require("../../services/licenseAssignmentService");

const getUnassigned = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const principals = await assignmentService.getUnassignedPrincipals(
      applicationId
    );
    res.json(principals);
  } catch (error) {
    next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { principalId, principalType } = req.body;
    // Capture actor info
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    const newAssignment = await assignmentService.addAssignment(
      applicationId,
      principalId,
      principalType,
      actorId,
      reqContext
    );
    res.status(201).json(newAssignment);
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    // Capture actor info
    const actorId = req.user.id;
    const reqContext = { ip: req.ip, userAgent: req.headers["user-agent"] };

    await assignmentService.removeAssignment(assignmentId, actorId, reqContext);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { getUnassigned, createAssignment, deleteAssignment };
