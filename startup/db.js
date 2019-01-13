const logger = require('../middleware/logging');

module.exports = () => {
    require('mongoose')
        .connect('mongodb://localhost/vidly', {useNewUrlParser: true, useCreateIndex: true})
        .then(logger.info('Connected to MongoDB...'));
}