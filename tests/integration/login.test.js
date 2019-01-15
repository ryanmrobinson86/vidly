const request = require('supertest');
const {User} = require('../../models/user');

describe('POST /api/login', () => {
    let server;
    let body;
    let user;

    const exec = () => {
        return request(server)
            .post('/api/login')
            .send(body);
    };

    beforeEach(async () => {
        server = require('../../index');
        body = {name: 'a', email: 'a@a', password: '12345'};
        user = new User(body);
        await user.hashPassword();
        await user.save();
        body.name = undefined;
    });
    afterEach( async () => { 
        await server.close();
        await User.deleteMany({});
    });

    it('should return 400 on missing email', async () => {
        body.email = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });
    
    it('should return 400 on missing password', async () => {
        body.password = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 on invalid email', async () => {
        body.email = 'b@a';

        const res = await exec();

        expect(res.status).toBe(400);
    });
    
    it('should return 400 on invalid password', async () => {
        body.password = '1234';

        const res = await exec();

        expect(res.status).toBe(400);
    });
    
    it('should return 200 if valid', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });
    
    it('should return the user in the body if valid', async () => {
        const res = await exec();

        expect(res.body).toHaveProperty('email', body.email);
    });
    
    it('should return the auth token in the x-auth-token header if valid', async () => {
        const res = await exec();

        expect(res.header['x-auth-token']).toMatch(user.generateAuthToken());
    });
});