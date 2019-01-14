const router = require('express').Router();
const auth_mw = require('../middleware/auth');
const { Rental } = require('../models/rental');
const { Movie } = require('../models/movie');

router.post('/', auth_mw, async (req, res) => {
    const {error} = Rental.validate(req.body);
    if(error) return res.status(400).send(error.details)
    
    const rental = await Rental.findOne({
        'customer._id': req.body.customerId, 
        'movie._id': req.body.movieId
    });
    if(!rental) return res.status(404).send('Rental not found.');
    const movie = await Movie.findById(rental.movie._id);
    if(!movie) return res.status(400).send('Movie not found.');

    if(rental.dateReturned || rental.rentalFee)
        return res.status(400).send('Invalid request. That rental is already finalized.');
    
    movie.numberInStock = movie.numberInStock + 1;
    await movie.save();

    rental.dateReturned = new Date();
    const days = (Date.parse(rental.dateReturned.toDateString())-Date.parse(rental.dateOut.toDateString()))/86400000;
    rental.rentalFee = rental.movie.dailyRentalRate * (days+1);
    await rental.save();

    res.send(rental);
});

module.exports = router;