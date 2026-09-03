const routes = require('./storage.routes');
const controller = require('./storage.controller');
const mongoStorageService = require('./services/mongoStorage.service');
const s3StorageService = require('./services/s3Storage.service');

module.exports = {
  routes,
  controller,
  mongoStorageService,
  s3StorageService
};
