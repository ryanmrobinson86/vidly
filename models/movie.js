const Joi = require('joi');
const mongoose = require('mongoose');
const {genreSchema} = require("./genre");

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
        required: true
    }
});

movieSchema.statics.validate = function (body) {
    const schema = {
        title:   Joi.string(),
        genreId:  Joi.objectId(),
        genreName: Joi.string(),
        numberInStock: Joi.number(),
        dailyRentalRate: Joi.number()
    };

    return Joi.validate(body, schema, {convert: true});
}

movieSchema.methods.search = async function (find, exact) {
    try {
        let query = this.find();

        if(find.title && !exact)
            query = query.find({
                title: {
                    $regex: find.title.trim(),
                    $options: 'i'
                }
            });
        else if(find.title) {
            query = query.find({
                title: {
                    $regex: `^${find.title.trim()}$`,
                    $options: 'i'
                }
            });
        }
        if(find.genre && !exact)
            query = query.find({
                'genre.name': {
                    $regex: find.genre.trim(),
                    $options: 'i'
                }
            });
        else if (find.genre) {
            query = query.find({
                'genre.name': {
                    $regex: `^${find.genre.trim()}$`,
                    $options: 'i'
                }
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
    catch (err) {
        console.error('Error with findMovies: ', err);
    }
}

const Movie = mongoose.model('Movie', movieSchema);

exports.Movie = Movie;