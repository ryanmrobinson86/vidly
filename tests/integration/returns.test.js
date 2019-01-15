const { Rental } = require('../../models/rental');
const { User } = require('../../models/user');
const { Movie } = require('../../models/movie');
const { Genre } = require('../../models/genre');
const mongoose = require('mongoose');
const request = require('supertest');
const moment = require('moment');

describe('/api/returns', () => {
    let server;
    let customerId;
    let movieId;
    let movie;
    let rental;
    let token;
    let inStock;
    let rate
    let rentalDate;

    const exec = () => {
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({ customerId, movieId });
    };

    beforeEach( async () => { 
        server = require('../../index'); 

        customerId = mongoose.Types.ObjectId().toHexString();
        movieId = mongoose.Types.ObjectId().toHexString();
        token = new User().generateAuthToken();
        inStock = 1;
        rate = 0.1;
        rentalDate = Date.now();

        movie = new Movie({
            _id: movieId,
            title: 'a',
            genre: new Genre({
                name: 'a'
            }),
            numberInStock: inStock,
            dailyRentalRate: rate
        });
        await movie.save();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: 'a'
            },
            movie: {
                _id: movieId,
                title: 'a',
                dailyRentalRate: rate
            },
            dateOut: rentalDate
        });
        await rental.save();
    });
    afterEach(async () => {
        await server.close();
        await Rental.deleteMany({});
        await Movie.deleteMany({});
    });

    // POST /api/returns
    // send {customerId, movieId}

    // Return 401 if not logged in
    it('should return 401 if a user is not logged in', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    // Return 400 if customerId not provided
    it('should return 400 if customerId not provided', async () => {
        customerId = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    // Return 400 if movieId not provided
    it('should return 400 if movieId not provided', async () => {
        movieId = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    // Return 404 if rental is not found
    it('should return 404 if rental is not found', async () => {
        customerId = mongoose.Types.ObjectId().toHexString();

        const res = await exec();

        expect(res.status).toBe(404);
    });

    // Return 400 if return already processed (rental finalized)
    it('should return 400 if rental is already finalized', async () => {
        // Rental finalized should mean:
        //      dateReturned and rentalFee populated.
        rental.dateReturned = new Date();
        rental.rentalFee = 1;
        await rental.save();

        const res = await exec();

        expect(res.status).toBe(400);
    });

    // Return 400 if the movie doesn't exist in the database.
    it('should return 400 if the movie doesnt exist in the database.', async () => {
        await Movie.deleteMany({});

        const res = await exec();

        expect(res.status).toBe(400);
    });

    // Return 200 if data valid
    it('should return 200 if data is valid', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });

    // Increment stock of movie if data valid
    it('should increment stock on returned movie', async () => {
        await exec();
        const found = await Movie.findById(movieId);

        expect(found.numberInStock).toBe(inStock+1);
    });

    // Update dateReturned property if data valid
    it('should assign dateReturned property', async () => {
        await exec();
        const found = await Rental.findById(rental._id);

        expect(moment(found.dateReturned).diff(moment())).toBeLessThanOrEqual(10000);
    });

    // Calculate the correct rentalRate

    // The Finalized rate should be the number of days * movie.dailyRentalRate
    it('should calculate rentalFee correctly', async () => {
        rental.dateOut = moment().subtract(7, 'days').toDate();
        await rental.save();
        await exec();
        const found = await Rental.findById(rental._id);

        expect(found.rentalFee).toBeCloseTo(7*rate);
    });  

    // Return Finalized rental in body if data valid
    it('should finalize rental info if data valid', async () => {
        const res = await exec();

        expect(res.body).toHaveProperty('movie._id', movieId);
        expect(res.body).toHaveProperty('customer._id', customerId);
    });
});