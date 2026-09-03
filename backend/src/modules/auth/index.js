const routes = require('./auth.routes');
const controller = require('./auth.controller');
const validator = require('./auth.validator');

module.exports = {
  routes,
  controller,
  validator
};
