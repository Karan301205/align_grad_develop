/**
 * Express middleware to validate request payload against a Zod schema.
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const errorDetails = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errorDetails
        });
      }
      return res.status(400).json({ error: err.message });
    }
  };
};

module.exports = validate;
