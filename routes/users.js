const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const Address = require('../schemas/address');
const Order = require('../schemas/order');
const Subscription = require('../schemas/subscription');
const stripe = require('stripe')(process.env.STRIPE_KEY);


router.post('/register', async (req, res) => {
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


    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      address: {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country
      }
    });
    user.stripeCustomerId = customer.id;    
    await user.save();

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


  // Add the new address to Stripe
  const customer = await stripe.customers.retrieve(user.stripeCustomerId);
  const stripeAddress = await stripe.customers.createSource(customer.id, {
    type: 'card',
    card: {
      address_line1: address.line1,
      address_line2: address.line2,
      address_city: address.city,
      address_state: address.state,
      address_zip: address.postalCode,
      address_country: address.country
    },
  });


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
    //if type is chosen subscription than there is option selection for subscription LIKE product.options = "oneYear".
    // if type is chosen oneTime  than product.options = null
    for (const product of req.body.products) {
      const { paymentType } = product; //oneTime or Subscription

      if( paymentType == 'oneTime' ){
        const { amount } = product;

        const order = new Order({
          amount: product.amount,
          price: product.price,
          user,
          address: user.defaultAddress,
          paymentType
        })
        //you can create and add receiptUrl
        await order.save();

      }
      else if( paymentType == 'Subscription' ){
        const { options, amount , normalPrice } = product

        let price, endDate;
        let startDate = new Date();


        switch( options ) {
          case 'oneMonth':
            price = normalPrice * 95 / 100;
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()); // set end date to 1 month from now
            break;
          case 'threeMonth':
            price = normalPrice * 85 / 100;
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate()); // set end date to 3 months from now
            break;
          case 'oneYear':
            price = normalPrice * 75 / 100;
            endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()); // set end date to 1 year from now
            break;
          default:
            return res.status(404).json({ error: "Invalid subscription plan: must be oneMonth, threeMonth, or oneYear" });
        }
      

        // Create a subscription object on Stripe
        const stripeSubscription = await stripe.subscriptions.create({
          customer: user.stripeCustomerId,
          items: [{ price: price * 100, price_data: { currency: 'usd' } }]
        });


        const subscription = new Subscription({
          options, 
          amount,
          price,
          startDate,
          endDate,
          user: user._id,
          stripeSubscriptionId: stripeSubscription.id,
        });
        await subscription.save();

        const order = new Order({
          amount,
          price,
          user,
          address: user.defaultAddress,
          paymentType
        })
        order.subscription = subscription._id;

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