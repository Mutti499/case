const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const Address = require('../schemas/address');
const Order = require('../schemas/order');
const Subscription = require('../schemas/subscription');


router.post('/register', async (req, res) => {
  try {

    // Create a new address
    const address = new Address(req.body.address);
    await address.save();    
    
    // Create a new user with the provided address, subscription, and order
    const user = new User({ 
      name: req.body.name, 
      email: req.body.email, 
      addresses: [address._id], 
    });

    // Save the new user
    await user.save();

    
    //Add user to that adress
    address.user = user;
    await address.save();  

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});



router.post('/newAdress/:id', async (req, res) => {
  try {
    //Form has new address informations


    // Create a new address
    const address = new Address(req.body.address);
    await address.save();    

    // find user and add adress
    const user = User.findById(req.params.id);
    await user.adresses.push(address);

    // Save the new user
    await user.save();

    //Add user to that adress
    address.user = user;
    await address.save();  
  
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/newSub/:id', async (req, res) => {
  try {
    //Form has new subscription informations

    // Create a new subscription
    const subscription = new Subscription({ 
      type: req.body.name,
      startDate: new Date(), //???
      endDate: req.body.endDate,
      price: req.body.price
    });
    await subscription.save();


    // find user and assign subscription
    const user = User.findById(req.params.id);
    user.subscription = subscription;

    // Save the new user
    await user.save();
  
    //Add user to that subsciption (unnecessary ????)
    subscription.user = user;
    await subscription.save(); 


    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/newOrder/:id', async (req, res) => {
  try {
    //Form has new subscription informations

    // find user
    const user = User.findById(req.params.id);

    // Create a new order for the user
    const order = new Order({ 
      amount: req.body.amount,
      user: user,
      address: user.addresses[0], // first adress will be default address of this user . FDefault address can be changed from options
      paymentMethod: req.body.paymentMethod,
      receiptUrl: req.body.receiptUrl
    });
    await order.save();

    // Save the order to new user
    await user.orders.push(order);
    await user.save();

    
    order.user = user;
    await order.save();


    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});



module.exports = router;
