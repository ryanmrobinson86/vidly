const Joi = require('joi');
const mongoose = require('mongoose');
const moment = require('moment');

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

rentalSchema.methods.finalize = function(date) {
    this.dateReturned = date;
    const days = moment(this.dateReturned).diff(this.dateOut, 'days');
    this.rentalFee = this.movie.dailyRentalRate * (days);
};

rentalSchema.statics.lookup = function(customerId, movieId) {
    return this.findOne({
        'customer._id': customerId, 
        'movie._id': movieId
    });
};

const Rental = new mongoose.model('Rental', rentalSchema);

Rental.validate = function (body) {
    const schema = {
        movieId: Joi.objectId().required(),
        customerId: Joi.objectId().required()
    };

    return Joi.validate(body, schema);
};

const Rental = new mongoose.model('Rental', rentalSchema);

exports.Rental = Rental;