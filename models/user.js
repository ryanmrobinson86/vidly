const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: Boolean
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ 
        _id: this._id,
        isAdmin: this.isAdmin 
    }, config.get('jwtPrivateKey'));
    return token;
};

const User = mongoose.model('User', userSchema);

User.validate = function (ob) {
    const schema = {
        name: Joi.string(),
        email: Joi.string().email(),
        password: Joi.string()
    }

    return Joi.validate(ob, schema);
}

exports.User = User;