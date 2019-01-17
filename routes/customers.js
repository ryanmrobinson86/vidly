const router = require('express').Router();
const Customer = require('../models/customer').Customer;
const auth_mw = require('../middleware/auth');
const admin_mw = require('../middleware/admin');
const validation = require('../middleware/validation');

// CREATE
router.post('/', auth_mw, validation(Customer.validate), async (req, res) => {
    // Verify that the customer doesn't already exist
    let found = await Customer.findByEmail(req.body.email);
    if(found) return res.status(409).send(found);
    
    // Add it if it can be added.
    const new_customer = new Customer({
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        isGold: req.body.isGold
    });
    new_customer.save();
    
    // Send the new customer back to the user
    res.send(new_customer);
});

// READ
router.get('/', auth_mw, async (req, res) => {
    let customers = await Customer.search(req.body);

    return res.status(customers.length?200:204).send(customers);
});

router.get('/:id', auth_mw, async (req, res) => {
    // Look up the customer with the given name, if it doesn't exist, return error.
    const customer = await Customer.findById(req.params.id.trim());
    if(!customer) return res.status(404).send(`Customer with ID ("${req.params.id.trim()}") does not exist.`);

    // If it does exist return the customer.
    res.send(customer);
});

// UPDATE
router.put('/:id', auth_mw, validation(Customer.validate), async (req, res) => {
    // Search for an exisiting customer with the same data and prevent the update if the found customer
    // is not the customer being updated.
    let customer = await Customer.findByEmail(req.body.email);
    if(customer && !customer._id.toString().match(new RegExp(req.params.id, 'i'))) return res.status(409).send(`There is already a matching customer with the data:\n${req.body}\n\n Nothing has been modified.`);
   
    // Look up the customer with the given id, if it doesn't exist, return error.
    customer = await Customer.findByIdAndUpdate(req.params.id.trim(), req.body);
    if(!customer) return res.status(404).send(`Customer with ID ("${req.params.id.trim()}") does not exist.`);

    customer = await Customer.findById(req.params.id.trim());
    res.send(customer);
});

// DELETE
router.delete('/:id', auth_mw, admin_mw, async (req, res) => {
    // Look up the customer with the given name, if it doesn't exist, return error.
    const customer = await Customer.findOneAndDelete({_id: req.params.id});
    if(!customer) return res.status(404).send(`Customer with ID ("${req.params.id}") does not exist.`);

    res.send(customer);
});

module.exports = router;