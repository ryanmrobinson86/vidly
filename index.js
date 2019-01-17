const express = require('express');
const app = express();
const logger = require('./middleware/logging');

// Setup the Exception handler.
require('./startup/exceptions')();
// Configure the Joi validation package.
require('./startup/validation')();
// Setup the production middleware.
require('./startup/prod')(app);
// Setup the routes.
require('./startup/routes')(app);
// Initialize db connections.
require('./startup/db')();
// Verify that configuration exists
require('./startup/config')();

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => logger.info(`listening on port ${PORT}...`));

module.exports = server;