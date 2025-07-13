const validate = (schema) => (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next(); // If validation is successful, proceed to the controller.
    } catch (e) {
      // If validation fails, send a 400 error
      return res.status(400).send(e.errors);
    }
  };
  
  module.exports = validate;