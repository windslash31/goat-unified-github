const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // If validation fails, return a 400 error with details
      return res.status(400).json({
        message: "Invalid request data.",
        errors: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    // For unexpected errors, pass them to the global error handler
    next(error);
  }
};

module.exports = { validate };
