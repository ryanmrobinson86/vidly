const Joi = require('joi');
const mongoose = require('mongoose');
const {genreSchema, Genre} = require("./genre");

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        min: 1,
        max: 256,
        required: true
    },
    genre: {
        type: genreSchema,
        required: true
    },
    numberInStock: {
        type: Number,
        default: 0
    },
    dailyRentalRate: {
        type: Number,
        min: 0,
        required: true
    }
});

movieSchema.statics.validate = function (body) {
    const schema = {
        title:   Joi.string(),
        genreId:  Joi.objectId(),
        genreName: Joi.string(),
        numberInStock: Joi.number(),
        dailyRentalRate: Joi.number().min(0.01)
    };

    return Joi.validate(body, schema, {convert: true});
}

movieSchema.statics.search = async function (find, exact) {
    let query = this.find();

    if(find.title && !exact) {
        query = query.find({
            title: {
                $regex: find.title.trim(),
                $options: 'i'
            }
        });
    }
    else if(find.title) {
        query = query.find({
            title: {
                $regex: `^${find.title.trim()}$`,
                $options: 'i'
            }
        });
    }
    if(find.genreName && !exact) {
        query = query.find({
            'genre.name': {
                $regex: find.genreName.trim(),
                $options: 'i'
            }
        });
    }
    else if (find.genreName) {
        query = query.find({
            'genre.name': {
                $regex: `^${find.genreName.trim()}$`,
                $options: 'i'
            }
        });
    }
    if(find.genreId) {
        query = query.find({
            'genre._id': find.genreId
        });
    }
    if(find.numberInStockMin) {
        query = query.find({
            numberInStock: {
                $gte: find.numberInStockMin
            }
        });
    }
    if(find.numberInStockMax) {
        query = query.find({
            numberInStock: {
                $lte: find.numberInStockMax
            }
        });
    }
    if(find.dailyRentalRateMin) {
        query = query.find({
            dailyRentalRate: {
                $gte: find.dailyRentalRateMin
            }
        });
    }
    if(find.dailyRentalRateMax) {
        query = query.find({
            dailyRentalRate: {
                $lte: find.dailyRentalRateMax
            }
        });
    }

    return await this.find(query).sort('title');
}

const Movie = mongoose.model('Movie', movieSchema);

exports.Movie = Movie;