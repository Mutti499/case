const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const Address = require('../schemas/address');
const Order = require('../schemas/order');
const Product = require('../schemas/product');
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
     
       //Body have IDs for every product and amount for that product 
       //if type is chosen subscription than there is option selection for subscription product.options = "oneYear".
       // if type is chosen oneTime  than product.options = noSub
     
       // product1 = new Product("A", 20 , "Lorem Ipsum", "nophoto", "oneTime", "noSub" )
       // product2 = new Product("B", 15 , "Lorem Ipsum", "nophoto", "Subscription", "oneMonth" )
       // product3 = new Product("C", 40 , "Lorem Ipsum", "nophoto", "oneTime", "noSub" )
       // product4 = new Product("D", 30 , "Lorem Ipsum", "nophoto", "Subscription", "threeMonth" )
       // product5 = new Product("E", 25 , "Lorem Ipsum", "nophoto", "Subscription", "onYear" )
     
      const productID = req.body.productID 
      const product = await Product.findById(productID)

      if(!product){
        return res.status(404).json({ error: 'Product not found' });
      }
      const { paymentType } = product; //oneTime or Subscription

      if( paymentType == 'oneTime' ){
        const amount  = req.body.amount;

        const order = new Order({
          amount,//Quantity
          price: product.price,
          user,
          address: user.defaultAddress,
          paymentType,
        })
        order.receiptUrl = "https://website.com/receipts/" + order._id + ".pdf"
        order.products.push(product);
        await order.save();

      }

      else if( paymentType == 'Subscription' ){
        const { options , price } = product
        const amount  = req.body.amount;

        let newPrice, endDate;
        let startDate = new Date();


        switch( options ) {
          case 'oneMonth':
            newPrice = price * 95 / 100;
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()); // set end date to 1 month from now
            break;
          case 'threeMonth':
            newPrice = price * 85 / 100;
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, startDate.getDate()); // set end date to 3 months from now
            break;
          case 'oneYear':
            newPrice = price * 75 / 100;
            endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()); // set end date to 1 year from now
            break;
          default:
            return res.status(404).json({ error: "Invalid subscription plan: must be oneMonth, threeMonth, or oneYear" });
        }
        
        // Create a new price object in Stripe
        const stripePrice = await stripe.prices.create({
          unit_amount: newPrice * 100, // price in cents
          currency: 'usd',
        });

        // Create a subscription object on Stripe
        const stripeSubscription = await stripe.subscriptions.create({
          customer: user.stripeCustomerId,
          items: [{ price: stripePrice.id, price_data: { currency: 'usd' } }]
        });


        const subscription = new Subscription({
          options, 
          amount,
          price: newPrice,
          startDate,
          endDate,
          user: user._id,
          stripeSubscriptionId: stripeSubscription.id,
          product
        });
        await subscription.save();

        const order = new Order({
          amount,
          price: newPrice,
          user,
          address: user.defaultAddress,
          paymentType
        })
        order.products.push(product);
        order.subscription = subscription._id;// First order is being sent for the subscription
        order.receiptUrl = "https://website.com/receipts/" + order._id + ".pdf"
        await order.save();

      
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
})


// cancel a subscription
router.post('/:id/cancelSubscription', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('subscription');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription) {
      // user does not have an active subscription

      return res.status(404).json({ error: 'User dont have subscription' });
    }

    const subscription = await Subscription.findById(user.subscription.subscriptionId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // cancel the subscription on Stripe
    await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    // set the subscription to inactive
    subscription.isActive = false;
    await subscription.save();

    return res.json({ message: 'Subscription cancelled successfully' });

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
})


//Create products case

// const product1 = new Product("A", 20 , "Lorem Ipsum", "nophoto", "oneTime", "noSub" )
// const product2 = new Product("B", 15 , "Lorem Ipsum", "nophoto", "Subscription", "oneMonth" )
// const product3 = new Product("C", 40 , "Lorem Ipsum", "nophoto", "oneTime", "noSub" )
// const product4 = new Product("D", 30 , "Lorem Ipsum", "nophoto", "Subscription", "threeMonth" )
// const product5 = new Product("E", 25 , "Lorem Ipsum", "nophoto", "Subscription", "onYear" )



module.exports = router;