const routes = require('./recruiter.routes');
const controller = require('./recruiter.controller');
const validator = require('./recruiter.validator');
const companyValidator = require('./recruiterCompany.validator');

module.exports = {
  routes,
  controller,
  validator,
  companyValidator
};
