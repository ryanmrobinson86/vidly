const Joi = require('joi');
const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
})

const Genre = mongoose.model('Genre', genreSchema);

Genre.findByName = async function (name) {
    if(name) {
        return await Genre
            .findOne({name: {$regex: name.trim(), $options: 'i'}});
    }
}

Genre.validate = function (name) {
    const schema = {
        name: Joi.string(),
        id: Joi.objectId()
    };

    return Joi.validate(name, schema);
}

exports.Genre = Genre;
exports.genreSchema = genreSchema;