const request = require('supertest');
const {User} = require('../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');

const endpoint = '/api/users/';

describe(endpoint, () => {
    let server;
    let token;
    let body;

    beforeEach(() => {server = require('../../index');});
    afterEach(async () => {
        await server.close();
        await User.deleteMany({});
    });

    describe('POST /', () => {
        const exec = () => {
            return request(server)
                .post(endpoint)
                .set('x-auth-token', token)
                .send(body);
        };

        beforeEach(() => {
            token = new User({isAdmin: true}).generateAuthToken();
            body = {
                name: 'a',
                email: 'a@a',
                password: '12345',
                isAdmin: true
            }
        });

        it('should return 401 if the client isnt logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if the client isnt logged in as admin', async () => {
            token = new User().generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 400 if the name is missing', async () => {
            body.name = ''

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if the email is missing', async () => {
            body.email = ''

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if the password is missing', async () => {
            body.password = ''

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 409 if the email already exists.', async () => {
            await User.insertMany([
                {name: 'a', email: 'a@a', password: '1234'}
            ]);

            const res = await exec();

            expect(res.status).toBe(409);
        });

        it('should return 200 if the user can be added.', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });
    
        it('should return the user in the body if valid', async () => {
            const res = await exec();
    
            expect(res.body).toHaveProperty('email', body.email);
        });
        
        it('should return the auth token in the x-auth-token header if valid', async () => {
            const res = await exec();

            const decoded = jwt.verify(res.header['x-auth-token'], config.get('jwtPrivateKey'));
            expect(decoded).toBeTruthy();
        });
    });
});