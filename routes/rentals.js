const router = require('express').Router();
const mongoose = require('mongoose');
const Fawn = require('fawn');
const {Customer} = require('../models/customer');
const {Movie} = require('../models/movie');
const {Rental} = require('../models/rental');
const auth_mw = require('../middleware/auth');
const validation = require('../middleware/validation');

Fawn.init(mongoose);

// Create a rental
router.post('/', auth_mw, validation(Rental.validate), async (req, res) => {
    const this_movie = await Movie.findById(req.body.movieId);
    if(!this_movie) return res.status(404).send(`Movie not found.`);

    const this_customer = await Customer.findById(req.body.customerId);
    if(!this_customer) return res.status(404).send(`Customer not found.`);

    if(this_movie.numberInStock <= 0) return res.status(404).send('There are no more in stock');

    const new_rental = await new Rental({
        movie: {
            _id: this_movie._id,
            title: this_movie.title,
            dailyRentalRate: this_movie.dailyRentalRate
        },
        customer: {
            _id: this_customer._id,
            name: this_customer.name
        }
    });
    try {
        new Fawn.Task()
            .save('rentals', new_rental)
            .update('movies', {_id: this_movie._id}, {$inc: {numberInStock: -1}})
            .run();
        res.send(new_rental);
    }
    catch(ex) {
        res.status(500).send('DB Operations failed.', ex);
    }
});

// Get all rentals
router.get('/', auth_mw, async (req, res) => {
    const rentals = await Rental.find().sort('-startDate');

    return res.status(rentals?200:204).send(rentals);

});

// Get a rental
router.get('/:id', auth_mw, async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if(!rental) return res.status(404).send('Rental not found');

    return res.status(rental?200:204).send(rental);

});

module.exports = router;