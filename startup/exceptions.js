// Set up the default logger to log unhandled exceptions
require('../middleware/logging');
// export a function to handle the unhandledRejection event by throwing
// an exception with the unhandled rejection in it.
module.exports = function () {
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });
}