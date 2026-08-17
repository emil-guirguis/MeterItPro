/**
 * API examples barrel export
 */

const simpleCrudApi = require('./simple-crud-api');
const authenticatedApi = require('./authenticated-api');

module.exports = {
  // Simple CRUD API example
  ...simpleCrudApi,
  
  // Authenticated API example
  ...authenticatedApi
};
