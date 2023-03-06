const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');

const user = require('../controller/user');
const order = require('../controller/order');


//register new user
router.post('/register', catchAsync(user.register));


//Add new address to the user
router.post('/:id/newAddress',catchAsync(user.newAdress));


//Create a new Order
router.post('/:id/newOrder', catchAsync(order.newOrder))


// cancel a subscription
router.post('/:id/cancelSubscription', catchAsync(user.cancelSubscription))

module.exports = router;