const Joi = require('joi');
const mongoose = require('mongoose');

const Customer = mongoose.model('Customer', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    isGold: {
        type: Boolean,
        default: false
    }
}));

Customer.validate = function (body) {
    const schema = {
        name:   Joi.string(),
        phone:  Joi.string().regex(
            /^((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|[ \(-\.\*]?[0-9]{3}[ \(-\.\*]?|[1-9]{0,3})(?:([ -\.\*]?[0-9]{2}){4}|((?:[0-9]{2}){4})|([ -\.\*]?[0-9]{3}[ -\.\*]?[0-9]{4})|([0-9]{7}))$/, 
            'Valid Phone Number'),
        email:  Joi.string().email(),
        isGold: Joi.boolean()
    };

    return Joi.validate(body, schema, {convert: true});
}

Customer.search = async function (find) {
   filters = {};
    if(find.name) {
        filters.name = {
            $regex: find.name.trim(),
            $options: 'i'
        };
    }
    if(find.phone) {
        filters.phone = {
            $regex: find.phone.trim(),
            $options: 'i'
        };
    }
    if(find.email) {
        filters.email = {
            $regex: `^${find.email.trim()}$`,
            $options: 'i'
        };
    }
    if(find.isGold) {
        filters.isGold = find.isGold;
    }
    
    return await Customer
            .find(filters)
            .sort('name');
}

exports.Customer = Customer;