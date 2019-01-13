const logger = require('../middleware/logging');

module.exports = function (err, req, res, next) {
    logger.error(err.message, err);
    res.status(500).send(`Internal Server Error:\n\n${err}`);
}