const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const Address = require('../schemas/address');
const Order = require('../schemas/order');
const Subscription = require('../schemas/subscription');

router.post('/register', async (req, res) => {
  console.log(req.body);
  try {
    // Create a new address
    const address = new Address(req.body.address);
    await address.save();    
    
    // Create a new user with the provided address, subscription, and order
    const user = new User({ 
      name: req.body.name, 
      email: req.body.email, 
      password: req.body.password, 

    });

    user.addresses.push(address)
    user.defaultAddress = address._id
    // Save the new user
    await user.save();

    
    //Add user to that address
    address.user = user;
    await address.save();  

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});



router.post('/:id/newAddress', async (req, res) => {
  try {
    //Form has new address informations
    const { isDefault } = req.body;
    // Create a new address
    const address = new Address(req.body.address);
    await address.save();    

    // find user and add address
    const user = await User.findById(req.params.id);
    user.addresses.push(address);

    if (isDefault == true) { // while using postman I couldnt manage to send isDefault as a boolean normally "if (isDefault)" is enough
      user.defaultAddress = address._id;
      await user.save();
    }

    // Save the new user
    await user.save();

    //Add user to that address
    address.user = user;
    await address.save();  

    console.log(user.defaultAddress)
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});



router.post('/:id/newOrder', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //Body have objects for every product { [{product1 : oneTime },{product2 : oneTime} ]}

    for (const product of req.body.products) {
      const { type } = product.paymentType; //oneTime or Subscription

      if( type == 'oneTime' ){
        const { amount } = product;
        const order = new Order(amount, user, user.defaultAddress, type)
        //you can create and add receiptUrl
        await order.save();

      }
      else if( type == 'Subscription' ){
        let price, endDate;
        let startDate = new Date();

        switch( options ) {
          case 'oneMonth':
            amount = 20;
            price = 100; 
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()); // set end date to 1 month from now
            break;
          case 'threeMonth':
            amount = 30;
            price = 250 
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate()); // set end date to 3 months from now
            break;
          case 'oneYear':
            amount = 40;
            price = 800; 
            endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()); // set end date to 1 year from now
            break;
          default:
            return res.status(404).json({ error: 'Subcription plan not found!' });
        }
      
        const subscription = new Subscription({
          options,
          amount,
          price,
          startDate,
          endDate,
          user: user._id
        });
        await subscription.save();
        await createSubscriptionOrder(subscription);


        const order = new Order(amount, user, user.defaultAddress, type) // first order created
        //you can create and add receiptUrl
        await order.save();

      }
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
})






module.exports = router;