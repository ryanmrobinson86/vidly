const router = require('express').Router();
const User = require('../models/user').User;
const _ = require('lodash');
const auth_mw = require('../middleware/auth');
const validation = require('../middleware/validation');

router.post('/', auth_mw, validation(User.validate), async (req, res) => {
    let user = await User.findOne({email: req.body.email});
    if(user) return res.status(400).send('User already exists');

    user = new User(_.pick(req.body, ['name', 'email', 'password']));

    await user.hashPassword();
    await user.save();

    const tok = user.generateAuthToken();
    res.header('x-auth-token', tok).send(_.pick(user, ['_id', 'name', 'email']));
});

router.get('/me', auth_mw, async (req, res) => {
    res.send(await User.findById(req.user._id).select('-password'));
});

module.exports = router;