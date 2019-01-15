const {User} = require('../../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

describe('user.generateAuthToken', () => {
    it('should return a valid JWT', () => {
        const user_ob = {
            _id: new mongoose.Types.ObjectId().toHexString(), 
            isAdmin: true
        };
        const user = new User(user_ob);
        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        expect(decoded).toMatchObject(user_ob);
    });
});

describe('user.hashPassword and user.validatePassword', async () => {
    it('should return a valid hash of the supplied password', async () => {
        const user = new User({
            name: 'a',
            email: 'a@a',
            password: '12345'
        })
        user.hashPassword();
        expect(user.validatePassword('12345')).toBeTruthy();
    });
})