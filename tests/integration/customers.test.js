const request = require('supertest');
const {User} = require('../../models/user');
const {Customer} = require('../../models/customer');
const mongoose = require('mongoose');

const endpoint = '/api/customers/'

describe(endpoint, () => {
    const existingCustomers = [
        { name: 'a', email: 'a@a', phone: '123.4567', isGold: true},
        { name: 'b', email: 'b@a', phone: '123.4567'},
        { name: 'c', email: 'c@a', phone: '123.4567'},
        { name: 'd', email: 'd@a', phone: '123.4567'},
    ];

    let server;
    let token;
    let customerId;
    let customer;
    
    beforeEach(() => { 
        server = require('../../index');
        token = new User().generateAuthToken();
    });
    afterEach(async () => {
        await server.close();
        await Customer.deleteMany({});
    })

    describe('POST /', () => {

        const exec = () => {
            return request(server)
                .post(endpoint)
                .set('x-auth-token', token)
                .send(customer);
        };

        beforeEach(() => {
            customer = {
                name: 'a',
                phone: '123.4567',
                email: '1@1',
                isGold: false
            };
        })
        // Should return 401 if a user is not logged in.
        it('should return 401 if a user is not logged in', async () => {
            token = '';
            
            const res = await exec();

            expect(res.status).toBe(401);
        });

        // Should return 400 if the name is missing.
        it('should return 400 if the name is missing', async () => {
            customer.name = '';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 400 if the email is missing.
        it('should return 400 if the email is missing', async () => {
            customer.email = '';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 400 if the email is not a valid email.
        it('should return 400 if the email is not a valid email', async () => {
            customer.email = 'a';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 400 if the phone is not a valid phone number.
        it('should return 400 if the phone is not a valid phone number', async () => {
            customer.phone = '1234';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 409 if a user with the same email was found.
        it('should return 409 if a user with the same email was found', async () => {
            await Customer.insertMany([
                { name: 'b', email: '1@1' }
            ]);
            
            const res = await exec();

            expect(res.status).toBe(409);
        });

        // Should return 200 if request is valid
        it('should return 200 if request is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        // Should allow a minimum customer (name and email only)
        it('should return 200 if request is only {name, email}', async () => {
            customer.phone = undefined;
            customer.isGold = undefined;

            const res = await exec();

            expect(res.status).toBe(200);
        });

        // Should add a new customer if the request is valid
        it('should add a new customer if the request is valid', async () => {
           await exec();

           const found = await Customer.findByEmail(customer.email);

            expect(found).toMatchObject(customer);
        });

        // Should return the new customer in the body if the reqeust is valid
        it('should return the new customer in the body if the reqeust is valid', async () => {
            const res = await exec();
 
            expect(res.body).toMatchObject(customer);
         }); 
    });

    describe('GET /', () => {
        let filter = {};
        const exec = () => {
            return request(server)
                .get(endpoint)
                .set('x-auth-token', token)
                .send(filter);
        };

        // Should return a status of 401 if client is not logged in.
        it('should return a status of 401 if client is not logged in', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        // Should return a status of 200 if client is logged in.
        it('should return a status of 200 if client is logged in', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        // Should return a list of all customers
        it('should return a list of all customers', async () => {
            await Customer.insertMany(existingCustomers);
            const res = await exec();

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'a', email: 'a@a'
                    })
                ])
            );
            expect(res.body.length).toBe(existingCustomers.length);
        });

        it('should returned a filterd list of all matching customers', async () => {
            await Customer.insertMany(existingCustomers);

            filter = {name: 'a', email: 'a@a', phone: '123.4567', isGold: true};
            const res = await exec();

            expect(res.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'a', email: 'a@a'
                    })
                ])
            );
            expect(res.body.length).toBe(1);
        });
    });

    describe('GET /:id', () => {
        const exec = async () => {
            return await request(server)
                .get(endpoint + customerId)
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            custOb = {name: 'a', email: 'a@a'};
            const customer = new Customer(custOb);
            await customer.save();
            customerId = customer._id;
        });

        // Should return a status of 401 if client is not logged in.
        it('should return a status of 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();
            expect(res.status).toBe(401);
        });

        // Should return a status of 404 if the id is not valid
        it('should return a status of 404 if the id is not valid', async () => {
            customerId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        // Should return a status of 200 if the id is valid
        it('should return a status of 200 if the id is valid', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        // Should return the customer record in the body if the id is valid
        it('should return the customer record in the body if the id is valid', async () => {
            const res = await exec();
            expect(res.body).toMatchObject(custOb);
        });
    });

    describe('PUT /:id', () => {
        const exec = async () => {
            return await request(server)
                .put(endpoint + customerId)
                .set('x-auth-token', token)
                .send(customer);
        };

        beforeEach(async () => {
            customer = {
                name: 'b', 
                email: 'b@a',
                phone: '123.4567',
                isGold: false
            };
            customerId = mongoose.Types.ObjectId().toHexString();
            await Customer.insertMany([
                {_id : customerId, name: 'a', email: 'a@a'},
                {name: 'c', email: 'c@a'}
            ])
        });

        // Should return a status of 401 if client is not logged in.
        it('should return a status of 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();
            expect(res.status).toBe(401);
        });

        // Should return a status of 404 if the id is not valid
        it('should return a status of 404 if the id is not valid', async () => {
            customerId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        // Should return 400 if the name is missing.
        it('should return 400 if the name is missing', async () => {
            customer.name = '';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 400 if the email is missing.
        it('should return 400 if the email is missing', async () => {
            customer.email = '';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 400 if the email is not a valid email.
        it('should return 400 if the email is not a valid email', async () => {
            customer.email = 'a';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 400 if the phone is not a valid phone number.
        it('should return 400 if the phone is not a valid phone number', async () => {
            customer.phone = '1234';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        // Should return 409 if a user with the same email was found.
        it('should return 409 if a user with the same email was found', async () => {
            customer.email = 'c@a'

            const res = await exec();

            expect(res.status).toBe(409);
        });

        // Should return 200 if request is valid
        it('should return 200 if request is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        // Should allow a minimum customer (name and email only)
        it('should return 200 if request is only {name, email}', async () => {
            customer.phone = undefined;
            customer.isGold = undefined;

            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the updated user if successful', async () => {
            const res = await exec();

            expect(res.body).toMatchObject(customer);
        });
    });

    describe('DELETE /:id', () => {
        const exec = async () => {
            return await request(server)
                .delete(endpoint + customerId)
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            token = new User({isAdmin: true}).generateAuthToken();
            customerId = mongoose.Types.ObjectId().toHexString();
            await Customer.insertMany([
                {_id : customerId, name: 'a', email: 'a@a'}
            ])
        });

        // Should return a status of 401 if client is not logged in.
        it('should return a status of 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();
            expect(res.status).toBe(401);
        });

        // Should return a status of 403 if user is not admin.
        it('should return a status of 403 if user is not admin', async () => {
            token = new User().generateAuthToken();

            const res = await exec();
            expect(res.status).toBe(403);
        });

        // Should return a status of 404 if the id is not valid
        it('should return a status of 404 if the id is not valid', async () => {
            customerId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();
            expect(res.status).toBe(404);
        });

        // Should return 200 if request is valid
        it('should return 200 if request is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should delete the customer if successful', async () => {
            await exec();

            const found = await Customer.findById(customerId);

            expect(found).toBeNull();
        });

        it('should return the deleted user if successful', async () => {
            const res = await exec();

            expect(res.body).toMatchObject({name: 'a', email: 'a@a'});
        });
    });
});