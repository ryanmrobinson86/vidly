const router = require('express').Router();
const auth_mw = require('../middleware/auth');
const validation = require('../middleware/validation');
const { Rental } = require('../models/rental');
const { Movie } = require('../models/movie');

router.post('/', auth_mw, validation(Rental.validate), async (req, res) => {    
    let rental = await Rental.lookup(req.body.customerId, req.body.movieId);
    if(!rental) return res.status(404).send('Rental not found.');

    if(rental.dateReturned || rental.rentalFee)
        return res.status(400).send('Invalid request. That rental is already finalized.');

    rental.finalize(new Date())
    await rental.save();

    const movie = await Movie.findByIdAndUpdate(rental.movie._id, {
        $inc: {numberInStock: 1}
    });
    if(!movie) return res.status(400).send('Movie doesnt exist.');

    res.send(rental);
});

module.exports = router;