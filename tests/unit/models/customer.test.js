const { Customer } = require('../../../models/customer');

describe('Customer.validate', () => {
    it('should reject customer with ill-formed email.', () => {
        let body = {email: 'no_at_symbol'};
        let result = Customer.validate(body);

        expect(result.error).not.toBeNull();

        body.email = '@beginning'
        result = Customer.validate(body);

        expect(result.error).not.toBeNull();

        body.email = 'end@'
        result = Customer.validate(body);

        expect(result.error).not.toBeNull();
    })

    it('should accept a customer with a correctly formed email.', () => {
        const body = {email: '1@1'};
        const result = Customer.validate(body);

        expect(result.error).toBeNull();
    });

    it('should accept a customer with a valid phone number.', () => {
        let phones = [
            {phone: '123.456.7890'},
            {phone: '+12345678901'},
            {phone: '001 (234) 567-8901'},
            {phone: '001 234*567-8901'},
            {phone: '+77 11 11 11 11'},
        ]
        phones.forEach(phone => {
            let result = Customer.validate(phone);
            expect(result.error).toBeNull();
        });
    })

    it('should reject a customer with an invalid phone number.', () => {
        let body = {phone: '123456'}
        let result = Customer.validate(body);

        expect(result.error).not.toBeNull();
    })
});