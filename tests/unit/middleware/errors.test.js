const errors = require('../../../middleware/errors');

describe('errors middleware', () => {
    it('should return status 500 when called.', () => {
        const err = {message: 'a'};
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }
        const next = null;

        errors(err, req, res, next);

        expect(res.status.mock.calls[0]).toContain(500);
    });
});