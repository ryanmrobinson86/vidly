const config = require('config');

module.exports = () => {
    if(!config.get('jwtPrivateKey')) {
        throw new Error('jwtPrivateKey config not found!');
    }
}