const routes = require('./storage.routes');
const controller = require('./storage.controller');
const databaseStorageService = require('./services/databaseStorage.service');
const s3StorageService = require('./services/s3Storage.service');

module.exports = {
  routes,
  controller,
  databaseStorageService,
  s3StorageService
};
