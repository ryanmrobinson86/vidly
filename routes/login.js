const Joi = require('joi');
const router = require('express').Router();
const User = require('../models/user').User;
const validation = require('../middleware/validation');
const _ = require('lodash');

router.post('/', validation(validate), async (req, res) => {
    let user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Invalid User or Password.');
    
    const valid = await user.validatePassword(req.body.password);
    if(!valid) return res.status(400).send('Invalid User or Password.');

    const tok = user.generateAuthToken();
    res.header('x-auth-token', tok).send(_.pick(user, ['name', 'email', '_id']));
});

function validate (user) {
    const schema = {
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }

    return Joi.validate(user, schema);
}

module.exports = router;