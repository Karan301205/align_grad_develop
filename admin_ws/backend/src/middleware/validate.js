/**
 * Express middleware to validate request payload against a Zod schema in Admin Portal.
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
      // zod v4 exposes validation problems on `issues` (`errors` on older versions)
      const issues = err.issues || err.errors;
      if (Array.isArray(issues)) {
        const errorDetails = issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({
          success: false,
          error: errorDetails[0]?.message || 'Validation failed',
          details: errorDetails
        });
      }
      return res.status(400).json({ error: err.message });
    }
  };
};

module.exports = validate;
