const routes = require('./upload.routes');
const controller = require('./upload.controller');
const validator = require('./upload.validator');
const fileCleanupService = require('./fileCleanup.service');

module.exports = {
  routes,
  controller,
  validator,
  fileCleanupService
};
