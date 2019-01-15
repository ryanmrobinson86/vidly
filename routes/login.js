const Joi = require('joi');
const router = require('express').Router();
const User = require('../models/user').User;
const _ = require('lodash');
const bcrypt = require('bcrypt');
const validation = require('../middleware/validation');

router.post('/', validation(validate), async (req, res) => {
    let user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Invalid User or Password.');
    
    const valid = await bcrypt.compare(req.body.password, user.password);
    if(!valid) return res.status(400).send('Invalid User or Password.');

    const tok = user.generateAuthToken();
    res.send(tok);
});

function validate (user) {
    const schema = {
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }

    return Joi.validate(user, schema);
}

module.exports = router;