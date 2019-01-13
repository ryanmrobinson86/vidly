const express = require('express');
const app = express();
const logger = require('./middleware/logging');

// Setup the Exception handler.
require('./startup/exceptions')();
// Configure the Joi validation package.
require('./startup/validation')();
// Setup the routes.
require('./startup/routes')(app);
// Initialize db connections.
require('./startup/db')();
// Verify that configuration exists
require('./startup/config')();

const server = app.listen(3000, () => logger.info(`listening on port 3000...`));

module.exports = server;