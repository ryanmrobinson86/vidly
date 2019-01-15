const validateObjectId = require('../middleware/validateObjectId');
const router = require('express').Router();
const Genre = require('../models/genre').Genre;
const auth_mw = require('../middleware/auth');
const admin_mw = require('../middleware/admin');
const validation = require('../middleware/validation');
const mongoose = require('mongoose');

// CREATE
router.post('/', auth_mw, validation(Genre.validate), async (req, res) => {
    // Verify that the genre doesn't already exist
    let genre = await Genre.findByName(req.body.name);
    if(genre) return res.status(302).send(genre);

    // Add it if it can be added.
    genre = new Genre({ name: req.body.name.toLowerCase().trim() });
    await genre.save();
    
    // Send the new genre back to the user
    res.send(genre);
});

// READ
router.get('/', async (req, res) => {
    // Send the genres object to the user.
    res.send(await Genre.find().sort('name'));
});

router.get('/:id', validateObjectId, async (req, res) => {
    // Look up the genre with the given name, if it doesn't exist, return error.
    const genre = await Genre.findById(req.params.id);
    if(!genre) return res.status(404).send(`Genre with id ("${req.params.id.trim()}") does not exist.`);

    // If it does exist return the genre.
    res.send(genre);
});

// UPDATE
router.put('/:id', auth_mw, validation(Genre.validate), validateObjectId, async (req, res) => {
    // If a genre with the new name already exists, alert the user.
    const found = await Genre.findByName(req.body.name);
    if(found && !found._id.toString().match(new RegExp(`${req.params.id.trim()}`, 'i'))) 
        return res.status(302).send(`There is already a genre with the name ("${req.body.name.trim()}"). Nothing has been modified.`);
    
    // Look up the genre with the given name, if it doesn't exist, return error.
    const genre = await Genre.findOneAndUpdate({_id: req.params.id}, {name: req.body.name}, {select: '_id name'});
    if(!genre) return res.status(404).send(`Genre with id ("${req.params.id}") does not exist.`);

    res.send(await Genre.findById(req.params.id));
});

// DELETE
router.delete('/:id', auth_mw, admin_mw, validateObjectId, async (req, res) => {
    // Look up the genre with the given name, if it doesn't exist, return error.
    const genre = await Genre.findOneAndDelete({_id: req.params.id});
    if(!genre) return res.status(404).send(`Genre ("${req.params.id.trim()}") does not exist.`);

    res.send(genre);
});

module.exports = router;