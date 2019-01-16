const {Movie} = require('../../models/movie');
const {User} = require('../../models/user');
const {Genre} = require('../../models/genre');
const request = require('supertest');
const mongoose = require('mongoose');

const endpoint = '/api/movies'

describe(endpoint, () => {
    let server; 
    beforeEach(() => { server = require('../../index');});
    afterEach(async () => {
        await server.close();
        await Movie.deleteMany({});
        await Genre.deleteMany({});
    });

    describe('POST /', () => {
        let token;
        let body;
        let genreId;

        const exec = () => {
            return request(server)
                .post(endpoint)
                .set('x-auth-token', token)
                .send(body);
        };

        beforeEach(() => {
            token = new User().generateAuthToken();
            genreId = mongoose.Types.ObjectId().toHexString();
            const genre = new Genre({
                _id: genreId,
                name: 'a'
            });
            genre.save();
            body = {
                title: 'a',
                genreId: genreId,
                numberInStock: 10,
                dailyRentalRate: 0.1
            };
        });

        it('should return 401 if the client isnt logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if the title is invalid', async () => {
            body.title = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if the genre is invalid', async () => {
            body.genreId = '';
            body.genreName = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if the dailyRentalRate is invalid', async () => {
            body.dailyRentalRate = 0;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 409 if the movie already exists', async () => {
            const movie = new Movie({
                title: 'a',
                genre: {
                    _id: genreId,
                    name: 'a'
                },
                dailyRentalRate: 0.1
            });
            await movie.save();

            const res = await exec();

            expect(res.status).toBe(409);
        });

        it('should return 409 if the movie already exists (by Genre Name)', async () => {
            const movie = new Movie({
                title: 'a',
                genre: {
                    _id: genreId,
                    name: 'a'
                },
                dailyRentalRate: 0.1
            });
            await movie.save();
            body.genreId = undefined;
            body.genreName = 'a';

            const res = await exec();

            expect(res.status).toBe(409);
        });

        it('should return 200 if the body is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should add the new movie if the body is valid', async () => {
            await exec();

            const found = await Movie.findOne({title: body.title, 'genre._id': genreId});

            expect(found).toHaveProperty('title', body.title);
        });

        it('should return the new movie in the response body if the body is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('title', body.title);
        });
    });
});