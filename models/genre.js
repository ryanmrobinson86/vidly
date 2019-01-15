const Joi = require('joi');
const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
});

genreSchema.statics.findByName = async function (name) {
    return await this.findOne({
        name: {$regex: name.trim(), $options: 'i'}
    });
};

genreSchema.statics.validate = function (name) {
    const schema = {
        name: Joi.string(),
        id: Joi.objectId()
    };

    return Joi.validate(name, schema);
}

const Genre = mongoose.model('Genre', genreSchema);

exports.Genre = Genre;
exports.genreSchema = genreSchema;