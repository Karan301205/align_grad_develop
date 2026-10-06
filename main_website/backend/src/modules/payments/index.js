const routes = require('./payment.routes');
const controller = require('./payment.controller');
const validator = require('./payment.validator');

module.exports = {
  routes,
  controller,
  validator
};
