const mongoose = require('mongoose');

module.exports = function(req, res, next) {
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(404).send('Id is not a valid Object Id');
    next();
}