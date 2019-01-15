const router = require('express').Router();
const Movie = require('../models/movie').Movie;
const Genre = require('../models/genre').Genre;
const auth_mw = require('../middleware/auth');
const validation = require('../middleware/validation');

// CREATE
router.post('/', auth_mw, validation(Movie.validate), async (req, res) => {
    // Verify that the movie doesn't already exist
    let movies = await Movie.search(body, true);
    if(movies.length) return res.status(302).send(movies);
    
    // Add it if it can be added.
    const new_movie = await new Movie({
        title: req.body.title.trim(), 
        genre: req.body.genreId?
            (await Genre.findById(req.body.genreId.trim())):
            req.body.genreName?(await Genre.findByName(req.body.genreName.trim())):
                undefined, 
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

    return res.status(movies?200:204).send(movies);
});

router.get('/:id', async (req, res) => {
    // Look up the movie with the given id, if it doesn't exist, return error.
    const movie = await Movie.findById(req.params.id.trim());
    if(!movie) return res.status(404).send(`Movie with ID ("${req.params.id.toLowerCase().trim()}") does not exist.`);

    // If it does exist return the customer.
    res.send(movie);
});

// UPDATE
router.put('/:id', auth_mw, validation(Movie.validate), async (req, res) => {
    // Search for an exisiting movie with the same data and prevent the update if the found movie
    // is not the movie being updated.
    const found = await Movie.search(req.body);
    if(found.length && !found[0]._id.toString().match(new RegExp(`${req.params.id}`, 'i'))) 
        return res.status(302).send(`There is already a matching movie with the data:\n${req.body}\n\n Nothing has been modified.`);
   
    // Get or create a new Genre
    let genre = undefined;
    if(req.body.genreId) {
        genre = await Genre.findById(req.body.genreId);
    }
    else if(req.body.genreName) {
        genre = await Genre.findByName(req.body.genreName);
        if(!genre) {
            genre = await new Genre({name: req.body.genreName});
            genre.save();
        }
    }
    // Look up the movie with the given name, if it doesn't exist, return error.
    const this_movie = await Movie.findById(req.params.id.trim());
    if(!this_movie) return res.status(404).send(`Movie with ID ("${req.params.id.trim()}") does not exist.`);

    if(req.body.title) this_movie.title = req.body.title;
    this_movie.genre = genre;
    if(req.body.numberInStock) this_movie.numberInStock = req.body.numberInStock;
    if(req.body.dailyRentalRate) this_movie.dailyRentalRate = req.body.dailyRentalRate;
    this_movie.save();
    res.send(this_movie);
});

// DELETE
router.delete('/:id', auth_mw, async (req, res) => {
    // Look up the customer with the given name, if it doesn't exist, return error.
    const movie = await Movie.findOneAndDelete({_id: req.params.id});
    if(!movie) return res.status(404).send(`Movie with ID ("${req.params.id.trim()}") does not exist.`);

    res.send(movie);
})

module.exports = router;