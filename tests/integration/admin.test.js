const {Genre} = require('../../models/genre');
const {User} = require('../../models/user');
const request = require('supertest');

describe('admin middleware', () => {
    let server;

    beforeEach(() => { server = require('../../index')});
    afterEach(async () => {
        await server.close();
        await Genre.deleteMany({});
    });

    it('should return 403 if the logged in user is not admin', async () => {
        const genre = new Genre({
            name: 'a' 
        });
        await genre.save();

        const token = new User().generateAuthToken();
        const res = await request(server)
            .delete('/api/genres/'+genre._id)
            .set('x-auth-token', token);

        expect(res.status).toBe(403);
    });
});