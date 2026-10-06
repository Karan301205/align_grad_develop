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
      const issues = err.issues || err.errors || [];
      if (issues.length > 0) {
        const firstIssue = issues[0];
        let cleanMsg = firstIssue.message;
        if (!cleanMsg || cleanMsg === 'Required') {
          const fieldName = firstIssue.path && firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'Field';
          cleanMsg = `${fieldName} is required or invalid`;
        }

        const errorDetails = issues.map(e => ({
          field: e.path ? e.path.join('.') : '',
          message: e.message
        }));

        return res.status(400).json({
          error: cleanMsg,
          details: errorDetails
        });
      }

      let errorMsg = err.message || 'Validation failed';
      if (typeof errorMsg === 'string' && (errorMsg.startsWith('[') || errorMsg.startsWith('{'))) {
        try {
          const parsed = JSON.parse(errorMsg);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
            errorMsg = parsed[0].message;
          } else if (parsed && parsed.message) {
            errorMsg = parsed.message;
          }
        } catch (_) {}
      }

      return res.status(400).json({ error: errorMsg });
    }
  };
};

module.exports = validate;
