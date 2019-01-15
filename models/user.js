const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');

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

userSchema.methods.hashPassword = async function() {
    this.password = await bcrypt.hash(this.password, await bcrypt.genSalt());
};

userSchema.methods.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.statics.validate = function (ob) {
    const schema = {
        name: Joi.string(),
        email: Joi.string().email(),
        password: Joi.string(),
        isAdmin: Joi.boolean()
    }

    return Joi.validate(ob, schema);
}

const User = mongoose.model('User', userSchema);

exports.User = User;