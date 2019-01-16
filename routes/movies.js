const router = require('express').Router();
const Movie = require('../models/movie').Movie;
const Genre = require('../models/genre').Genre;
const auth_mw = require('../middleware/auth');
const admin_mw = require('../middleware/admin');
const validation = require('../middleware/validation');
const validateOids = require('../middleware/validateObjectId');

// CREATE
router.post('/', auth_mw, validation(Movie.validate), async (req, res) => {
    // Verify that the movie doesn't already exist
    let movies = await Movie.search(req.body, true);
    if(movies.length) return res.status(409).send('Movie with the same title/genre already exists.');

    let genre;
    // Verify that the genre is valid
    if(req.body.genreId) {
        genre = await Genre.findById(req.body.genreId.trim());
    }
    else if(req.body.genreName) {
        genre = await Genre.findByName(req.body.genreName.trim());
    }
    else return res.status(400).send('Genre is required');
    
    // Add it if it can be added.
    const new_movie = await new Movie({
        title: req.body.title.trim(), 
        genre: genre, 
        numberInStock: req.body.numberInStock, 
        dailyRentalRate: req.body.dailyRentalRate
    });
    new_movie.save();
    
    // Send the new movie back to the user
    res.send(new_movie);
});

// READ
router.get('/', async (req, res) => {
    let movies = await Movie.search(req.body);

    return res.status(movies.length?200:204).send(movies);
});

router.get('/:id', validateOids, async (req, res) => {
    // Look up the movie with the given id, if it doesn't exist, return error.
    const movie = await Movie.findById(req.params.id.trim());
    if(!movie) return res.status(404).send(`Movie with ID ("${req.params.id.toLowerCase().trim()}") does not exist.`);

    // If it does exist return the customer.
    res.send(movie);
});

// UPDATE
router.put('/:id', auth_mw, validation(Movie.validate), async (req, res) => {
    // Search for the movie being updated
    let movie = await Movie.findById(req.params.id);
    if(!movie) return res.status(404).send(`Movie with ID ("${req.params.id.trim()}") does not exist.`);
    
    let update = {};
    if(req.body.title) update.title = req.body.title;
    else    update.title = movie.title;
    if(req.body.genreId) update.genreId = req.body.genreId;
    else if(req.body.genreName) update.genreName = req.body.genreName;
    else    update.genreId = movie.genre._id;

    // Check to make sure that there isn't a movie with the same data in the update.
    movies = await Movie.search(update, true);
    // If there is a movie found, but it's this movie, allow it.
    if(movies.length && !movies[0]._id.toString().match(new RegExp(`${req.params.id}`, 'i'))) 
        return res.status(409).send(`There is already a matching movie with the data:\n${req.body}\n\n Nothing has been modified.`);
   
    let genre;
    // Verify that the genre is valid
    if(req.body.genreId) {
        genre = await Genre.findById(req.body.genreId.trim());
    }
    else if(req.body.genreName) {
        genre = await Genre.findByName(req.body.genreName.trim());
    }
    if((req.body.genreId || req.body.genreName) && !genre)
        return res.status(400).send('Genre is invalid.');

    // Update the info
    if(req.body.title) movie.title = req.body.title;
    if(req.body.genreId || req.body.genreName) movie.genre = genre;
    if(req.body.numberInStock) movie.numberInStock = req.body.numberInStock;
    if(req.body.dailyRentalRate) movie.dailyRentalRate = req.body.dailyRentalRate;
    await movie.save();

    res.send(movie);
});

// DELETE
router.delete('/:id', auth_mw, admin_mw, async (req, res) => {
    // Look up the customer with the given name, if it doesn't exist, return error.
    const movie = await Movie.findOneAndDelete({_id: req.params.id});
    if(!movie) return res.status(404).send(`Movie with ID ("${req.params.id.trim()}") does not exist.`);

    res.send(movie);
})

module.exports = router;