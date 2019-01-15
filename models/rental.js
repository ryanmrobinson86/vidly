const Joi = require('joi');
const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    movie: {
        type: new mongoose.Schema({
            title: {
                type: String,
                trim: true,
                required: true
            },
            dailyRentalRate: {
                type: Number,
                required: true
            }
        }),
        required: true
    },
    customer : {
        type: new mongoose.Schema({
            name: {
                type: String,
                required: true
            }
        }),
        required: true
    },
    dateOut: {
        type: Date,
        required: true,
        default: Date.now()
    },
    dateReturned: Date,
    rentalFee: Number
});

rentalSchema.statics.validate = function (body) {
    const schema = {
        movieId: Joi.objectId().required(),
        customerId: Joi.objectId().required()
    };

    return Joi.validate(body, schema);
};

const Rental = new mongoose.model('Rental', rentalSchema);

exports.Rental = Rental;