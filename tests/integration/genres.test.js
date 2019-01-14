const request = require('supertest');
const {Genre} = require('../../models/genre')
const {User} = require('../../models/user');
const mongoose = require('mongoose');

let server;

describe('/api/genres', () => {
    beforeEach(async () => { server = await require('../../index'); });
    afterEach(async () => {
        await server.close();
        await Genre.deleteMany({});
    });

    describe('GET /', () => {
        it('should return all genres', async () => {
            await Genre.insertMany([
                {name: 'genre1'},
                {name: 'genre2'}
            ]);
            
            const res = await request(server).get('/api/genres')
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(g => g.name = 'genre1')).toBeTruthy();
            expect(res.body.some(g => g.name = 'genre2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return 404 for invalid id', async () => {
            const Oid = mongoose.Types.ObjectId();

            let res = await request(server).get('/api/genres/' + Oid.toHexString());
            expect(res.status).toBe(404);
            res = await request(server).get('/api/genres/1');
            expect(res.status).toBe(404);
        });
        
        it('should return the genre with a valid id', async () => {
            const genre = new Genre({name: 'genre1'});
            await genre.save();

            const res = await request(server).get('/api/genres/' + genre._id);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });
    });

    describe('POST /', () => {

        let token;
        let name;

        const exec = async () => {
            return await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send({name});
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'genre1';
        })

        it('should return 401 if the client is not logged in.', async () => {
            token = '';

            const res = await exec();
            
            expect(res.status).toBe(401);
        });

        it('should return 302 if the genre already exists.', async () => {
            const genre = new Genre({name});
            await genre.save();

            const res = await exec();
            
            expect(res.status).toBe(302);
        });

        it('should  add the genre if everything is ok.', async () => {
            await exec();
            
            const found = await Genre.findOne({name: 'genre1'});
            expect(found).not.toBeNull();
        });

        it('should return 200 if everything is ok.', async () => {
            const res = await exec();
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', name);
        });
    });
});
