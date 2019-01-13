const {User} = require('../../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

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