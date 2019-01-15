const Joi = require('joi');
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
        trim: true,
        unique: true,
        required: true
    },
    isGold: {
        type: Boolean,
        default: false
    }
});

customerSchema.statics.search = async function (find) {
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
    
    return await this.find(filters).sort('name');
}

customerSchema.statics.findByEmail = async function(email) {
    return await this.findOne({email});
}

customerSchema.statics.validate = function (body) {
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

const Customer = mongoose.model('Customer', customerSchema);



exports.Customer = Customer;