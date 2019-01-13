const router = require('express').Router();
const Customer = require('../models/customer').Customer;
const auth_mw = require('../middleware/auth');

// CREATE
router.post('/', auth_mw, async (req, res) => {
    // If the customer doesn't exisit, and the body is in the correct format, add it to the db.
    const { error } = Customer.validate(req.body);
    if(error) return res.status(400).send(error.details[0].message)

    // Verify that the customer doesn't already exist
    let customers = await Customer.search(req.body);
    if(customers.length) return res.status(302).send(customers);
    
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

    return res.status(customers?200:204).send(customers);
});

router.get('/:id', auth_mw, async (req, res) => {
    // Look up the customer with the given name, if it doesn't exist, return error.
    const customer = await Customer.findById(req.params.id.trim());
    if(!customer) return res.status(404).send(`Customer with ID ("${req.params.id.trim()}") does not exist.`);

    // If it does exist return the customer.
    res.send(customer);
});

// UPDATE
router.put('/:id', auth_mw, async (req, res) => {
    // If the customer exists, and the body has a valid update contents, that doesn't already exist in the
    // data, reassign the customer attributes.
    const { error } = Customer.validate(req.body);
    if(error) return res.status(400).send(error.details[0].message)

    // Search for an exisiting customer with the same data and prevent the update if the found customer
    // is not the customer being updated.
    const found = await Customer.search(req.body);
    if(found.length && !found[0]._id.toString().match(new RegExp(`${req.params.id}`, 'i'))) 
        return res.status(302).send(`There is already a matching customer with the data:\n${req.body}\n\n Nothing has been modified.`);
   
    // Look up the customer with the given name, if it doesn't exist, return error.
    const this_customer = await Customer.findById(req.params.id.trim());
    if(!this_customer) return res.status(404).send(`Customer with ID ("${req.params.id.trim()}") does not exist.`);

    if(req.body.name) this_customer.name = req.body.name;
    if(req.body.phone) this_customer.phone = req.body.phone;
    if(req.body.isGold) this_customer.isGold = req.body.isGold;
    if(req.body.email) this_customer.email = req.body.email;
    this_customer.save();
    res.send(this_customer);
});

// DELETE
router.delete('/:id', auth_mw, async (req, res) => {
    // Look up the customer with the given name, if it doesn't exist, return error.
    const customer = await Customer.findOneAndDelete({_id: req.params.id});
    if(!customer) return res.status(404).send(`Customer with ID ("${req.params.id}") does not exist.`);

    res.send(customer);
});

module.exports = router;