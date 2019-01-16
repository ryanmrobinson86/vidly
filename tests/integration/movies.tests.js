const {Movie} = require('../../models/movie');
const {User} = require('../../models/user');
const {Genre} = require('../../models/genre');
const request = require('supertest');

const endpoint = '/api/movies'

describe(endpoint, () => {
    let server;

    beforeEach(() => { server = require('../../index');});
    afterEach(async () => {
        await server.close();
        await Movie.deleteMany({});
    });

    describe('POST /', () => {
        let token;
        let body;

        const exec = () => {
            return request(server)
                .post(endpoint)
                .set('x-auth-token', token)
                .send(body);
        };

        beforeEach(() => {
            token = new User().generateAuthToken();
            body = {
                title: 'a',
                genre: new Genre({name: 'a'}),
                numberInStock: 10,
                dailyRentalRate: 0.1
            };
        });

        it('should return 401 if the client isnt logged in', () => {
            token = '';

            const res = exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if the title is invalid', () => {
            body.title = '';

            const res = exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if the genre is invalid', () => {
            body.Genre = undefined;

            const res = exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if the dailyRentalRate is invalid', () => {
            body.dailyRentalRate = undefined;

            const res = exec();

            expect(res.status).toBe(401);
        });
    });
});