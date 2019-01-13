const logger = require('../middleware/logging');
const config = require('config');

const dbname = config.get('db')

module.exports = () => {
    require('mongoose')
        .connect(dbname, {useNewUrlParser: true, useCreateIndex: true})
        .then(logger.info(`Connected to ${dbname}`));
}