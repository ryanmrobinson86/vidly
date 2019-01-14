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
        let body;

        const exec = async () => {
            return await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send(body);
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'genre1';
            body = {name}
        })

        it('should return 401 if the client is not logged in.', async () => {
            token = '';

            const res = await exec();
            
            expect(res.status).toBe(401);
        });

        it('should return 400 for invalid body.', async () => {
            body = {name: true};

            const res = await exec();

            expect(res.status).toBe(400);
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

    describe('PUT /:id', () => {
        let id;
        let token;
        let body;
        let genre;
        let name;

        const exec = () => {
            return request(server)
                .put('/api/genres/'+ id)
                .set('x-auth-token', token)
                .send(body);
        }

        beforeEach(async () => {
            token = new User().generateAuthToken();
            name = 'genre2'
            body = {name};
            genre = new Genre({name: 'genre1'});
            await genre.save();
            id = genre._id;
        });

        it('should return 401 if user not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 404 for invalid id', async () => {
            id = '1';

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 400 for invalid body.', async () => {
            body = {name: true}

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 302 for body with name of existing genre.', async () => {
            const genre2 = new Genre({name});
            await genre2.save();

            const res = await exec();

            expect(res.status).toBe(302);
        });

        it('should return 404 for id not found in collection.', async () => {
            id = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 200 and the updated genre for updated successfully.', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', name)
        });

        it('should update genre if valid put request.', async () => {
            await exec();

            const found = await Genre.findById(id);
            expect(found.name).toMatch(name);
        });
    });

    describe('DELETE /:id', () => {
        let id;
        let user;
        let token;
        let name;
        let genre;

        const exec = () => {
            return request(server)
                .delete('/api/genres/'+ id)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            user = {
                _id: mongoose.Types.ObjectId().toHexString(),
                isAdmin: true
            }
            token = new User(user).generateAuthToken();
            name = 'genre1'
            genre = new Genre({name});
            await genre.save();
            id = genre._id;
        });

        it('should return 401 if user not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not admin', async () => {
            const user = {
                _id: mongoose.Types.ObjectId().toHexString(),
            }
            token = new User(user).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 if genre is not found', async () => {
            id = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 200 if genre is found', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the genre in the body if found', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('name', name);
        });

        it('should delete the genre if found', async () => {
            const res = await exec();

            const found = await Genre.findById(id);

            expect(found).toBeNull();
        });
    });
});
