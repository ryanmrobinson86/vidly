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
            delete body.genreId;

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
            delete body.genreId;
            body.genreName = 'a';

            const res = await exec();

            expect(res.status).toBe(409);
        });

        it('should return 200 if the body is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return 200 if the body is valid (with genreName only)', async () => {
            delete body.genreId;
            body.genreName = 'a';
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

    describe('GET /', () => {
        let body = {};

        const exec = () => {
            return request(server)
                .get(endpoint)
                .send(body);
        };

        beforeEach(async () => {
            await Movie.insertMany([
                {title: 'a', genre: {name: 'a'}, numberInStock: 5, dailyRentalRate: 10},
                {title: 'b', genre: {name: 'b'}, numberInStock: 6, dailyRentalRate: 9},
                {title: 'c', genre: {name: 'c'}, numberInStock: 7, dailyRentalRate: 8},
                {title: 'd', genre: {name: 'a'}, numberInStock: 8, dailyRentalRate: 7},
                {title: 'e', genre: {name: 'b'}, numberInStock: 9, dailyRentalRate: 6},
                {title: 'f', genre: {name: 'c'}, numberInStock: 10, dailyRentalRate: 5},
            ]);
        });

        it('should return 204 if there are no movies to return.', async () => {
            await Movie.deleteMany({});
            const res = await exec();

            expect(res.status).toBe(204);
        });

        it('should return 200 if there are movies to return.', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the list of movies if there are movies to return.', async () => {
            const res = await exec();

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({title: 'a'}),
                    expect.objectContaining({title: 'b'}),
                    expect.objectContaining({title: 'c'}),
                    expect.objectContaining({title: 'd'}),
                    expect.objectContaining({title: 'd'}),
                    expect.objectContaining({title: 'f'})
                ])
            );
        });

        it('should return the list of movies if there are movies to return. (Filtered by title)', async () => {
            body = {title: 'a'}
            const res = await exec();

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({title: 'a'})
                ]),
                expect.not.arrayContaining([
                    expect.objectContaining({title: 'b'}),
                    expect.objectContaining({title: 'c'}),
                    expect.objectContaining({title: 'd'}),
                    expect.objectContaining({title: 'e'}),
                    expect.objectContaining({title: 'f'})
                ])
            );
        });

        it('should return the list of movies if there are movies to return. (Filtered by genreName)', async () => {
            body = {genreName: 'a'}
            const res = await exec();

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({title: 'a'}),
                    expect.objectContaining({title: 'd'})
                ]),
                expect.not.arrayContaining([
                    expect.objectContaining({title: 'b'}),
                    expect.objectContaining({title: 'c'}),
                    expect.objectContaining({title: 'e'}),
                    expect.objectContaining({title: 'f'})
                ])
            );
        });

        it('should return the list of movies if there are movies to return. (Filtered by rentalRate)', async () => {
            body = {dailyRentalRateMin: 8, dailyRentalRateMax: 10}
            const res = await exec();

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({title: 'a'}),
                    expect.objectContaining({title: 'b'}),
                    expect.objectContaining({title: 'c'})
                ]),
                expect.not.arrayContaining([
                    expect.objectContaining({title: 'd'}),
                    expect.objectContaining({title: 'e'}),
                    expect.objectContaining({title: 'f'})
                ])
            );
        });

        it('should return the list of movies if there are movies to return. (Filtered by numberInStock)', async () => {
            body = {numberInStockMin: 8, numberInStockMax: 10}
            const res = await exec();

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({title: 'd'}),
                    expect.objectContaining({title: 'e'}),
                    expect.objectContaining({title: 'f'})
                ]),
                expect.not.arrayContaining([
                    expect.objectContaining({title: 'a'}),
                    expect.objectContaining({title: 'b'}),
                    expect.objectContaining({title: 'c'})
                ])
            );
        });
    });

    describe('GET /:id', () => {
        let movieId;
        const exec = () => {
            return request(server)
                .get(endpoint + '/'+ movieId);
        };

        beforeEach(async () => {
            movieId = mongoose.Types.ObjectId().toHexString();
            await Movie.insertMany([
                {
                    _id: movieId,
                    title: 'a', 
                    genre: {name: 'a'}, 
                    numberInStock: 5, 
                    dailyRentalRate: 10
                }
            ]);
        });
    
        it('should return 404 for invalid Id.',async () => {
            movieId = '1'

            const res = await exec();

            expect(res.status).toBe(404);
        });
    
        it('should return 404 for movie not found.',async () => {
            movieId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });
    
        it('should return 200 for a valid id.',async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });
    
        it('should return the movie in the body for a valid id.',async () => {
            const res = await exec();

            expect(res.body).toMatchObject({_id: movieId});
        });
    });
    
    describe('PUT /', () => {
        let id;
        let token;
        let body;
        let genreId;
        let genre;
        let movie;

        const exec = () => {
            return request(server)
                .put(endpoint + '/' + id)
                .set('x-auth-token', token)
                .send(body);
        };

        beforeEach(async () => {
            token = new User().generateAuthToken();
            genreId = mongoose.Types.ObjectId().toHexString();
            await Genre.insertMany([
                {_id: genreId, name: 'a'}
            ]);
            await Movie.insertMany([
                {
                    title: 'a',
                    genre: {_id: genreId, name: 'a'},
                    numberInStock: 0,
                    dailyRentalRate: 1
                }
            ]);
            genre = new Genre({name: 'b'});
            await genre.save();
            movie = new Movie({
                title: 'b',
                genre,
                dailyRentalRate: 1
            });
            await movie.save();
            body = {
                title: 'c',
                genreId: genreId,
                numberInStock: 10,
                dailyRentalRate: 0.1
            };
            id = movie._id;
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
            body.genreId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if the dailyRentalRate is invalid', async () => {
            body.dailyRentalRate = 0;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 409 if the movie already exists', async () => {
            body.title = 'a';
            body.genreId = genreId;

            const res = await exec();

            expect(res.status).toBe(409);
        });

        it('should return 409 if the movie already exists (by Genre Name)', async () => {
            body.title = 'a';
            body.genreName = 'a';

            const res = await exec();

            expect(res.status).toBe(409);
        });

        it('should return 404 if the movie can\'t be found', async () => {
            id = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 200 if the body is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should allow updates of title only', async () => {
            body = { title: 'z'};

            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should allow updates of genre only', async () => {
            body = { genreId };

            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should allow updates of numberInStock only', async () => {
            body = { numberInStock: 20 };

            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should allow updates of dailyRentalRate only', async () => {
            body = { dailyRentalRate: 20 };

            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return 200 if the body is valid (with genreName only)', async () => {
            delete body.genreId;
            body.genreName = 'a';
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

    describe('DELETE /:id', () => {
        let id;
        let user;
        let token;
        let movie;

        const exec = () => {
            return request(server)
                .delete(endpoint + '/'+ id)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            user = {
                _id: mongoose.Types.ObjectId().toHexString(),
                isAdmin: true
            }
            token = new User(user).generateAuthToken();
            movie = new Movie(
                {
                    title: 'a',
                    genre: {name: 'a'},
                    numberInStock: 0,
                    dailyRentalRate: 1
                }
            );
            id = movie.id;
            await movie.save();
        });

        it('should return 401 if user not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not admin', async () => {
            user = {
                _id: mongoose.Types.ObjectId().toHexString(),
            }
            token = new User(user).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 if movie is not found', async () => {
            id = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 200 if movie is found', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the movie in the body if found', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('title', movie.title);
        });

        it('should delete the genre if found', async () => {
            await exec();

            const found = await Movie.findById(movie.id);

            expect(found).toBeNull();
        });
    });
});