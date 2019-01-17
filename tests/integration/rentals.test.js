const request = require('supertest');
const mongoose = require('mongoose');
const moment = require('moment');
const {Genre} = require('../../models/genre');
const {Movie} = require('../../models/movie');
const {Customer} = require('../../models/customer');
const {Rental} = require('../../models/rental');
const {User} = require('../../models/user');

const endpoint = '/api/rentals';

describe(endpoint, () => {
    let server;
    let customerId;
    let movieId;
    let  initialMovie;
    
    afterAll(() => {
        return async () => {
            await Customer.deleteMany({});
            await Movie.deleteMany({});
        }
    });

    beforeEach(async () => { 
        server = require('../../index');
        customerId = mongoose.Types.ObjectId().toHexString();
        movieId = mongoose.Types.ObjectId().toHexString();
        initialMovie = {
            _id: movieId,
            title: 'b',
            genre: new Genre({name: 'a'}),
            numberInStock: 5,
            dailyRentalRate: 1
        };// Populate the Movie and Customer collections with test data.
        await Customer.insertMany([
            {
                _id: customerId,
                name: 'a',
                email: 'a@a'
            }
        ]);
        await Movie.insertMany([initialMovie]);
    });
    afterEach(async () => { 
        await server.close();
        await Rental.deleteMany({});
        await Customer.deleteMany({});
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
            body = { customerId, movieId };
        });

        it('should return 401 if the client isn\'t logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if the customerId is missing', async () => {
            body = { movieId }

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if the customer isn\'t found', async () => {
            body = { customerId: mongoose.Types.ObjectId().toHexString(), movieId }

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 400 if the movieId is missing', async () => {
            body = { customerId }

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if the movie isn\'t found', async () => {
            body = { customerId, movieId: mongoose.Types.ObjectId().toHexString() }

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if the movie has no stock', async () => {
            await Movie.findByIdAndUpdate(movieId, {numberInStock: 0});
            
            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 200 if rental can be made', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should create the rental with today\'s date if rental can be made', async () => {
            await exec();

            const rental = await Rental.findOne();
            expect(moment(rental.dateOut).format('YYYY-MM-DD')).toMatch(moment().format('YYYY-MM-DD'));
        });
    });

    describe('GET /', () => {
        let token;
        let rental;

        const exec = () => {
            return request(server)
                .get(endpoint)
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            token = new User().generateAuthToken();
            rental = new Rental({
                customer: new Customer({
                    name: 'a'
                }),
                movie: new Movie({
                    title: 'a',
                    dailyRentalRate: 2
                })
            });
            await rental.save();
        });

        it('should return 401 if the client isn\'t logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 204 if there are no rentals', async () => {
            await Rental.deleteMany({});

            const res = await exec();

            expect(res.status).toBe(204);
        });

        it('should return 200 if there are rentals', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the list of rentals if there are rentals', async () => {
            const res = await exec();

            expect(res.body.length).toBe(1);
            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        dateOut: expect.anything()
                    })
                ])
            );
        });
    });

    describe('GET /:id', () => {
        let token;
        let rental;
        let id;

        const exec = () => {
            return request(server)
                .get(endpoint + '/' + id)
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            token = new User().generateAuthToken();
            rental = new Rental({
                customer: new Customer({
                    name: 'a'
                }),
                movie: new Movie({
                    title: 'a',
                    dailyRentalRate: 2
                })
            });
            id = rental._id;
            await rental.save();
        });

        it('should return 401 if the client isn\'t logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 404 if the rental is not found', async () => {
            id = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 200 if there is a rental with the id', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the rental if one was found', async () => {
            const res = await exec();

            expect(res.body).toEqual(
                expect.objectContaining({
                    dateOut: expect.anything()
                })
            );
        });
    });
});