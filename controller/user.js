const User = require('../schemas/user');
const Address = require('../schemas/address');
const Order = require('../schemas/order');
const Product = require('../schemas/product');
const Subscription = require('../schemas/subscription');
const stripe = require('stripe')(process.env.STRIPE_KEY);


const register = async (req, res) => {

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

  }


const newAdress =  async (req, res) => {

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
  }


const cancelSubscription = async (req, res) => {

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
  }

  module.exports = {
    register,
    newAdress,
    cancelSubscription
}


//Create products case

// const product1 = new Product("A", 20 , "Lorem Ipsum", "nophoto", "oneTime", "noSub" )
// const product2 = new Product("B", 15 , "Lorem Ipsum", "nophoto", "Subscription", "oneMonth" )
// const product3 = new Product("C", 40 , "Lorem Ipsum", "nophoto", "oneTime", "noSub" )
// const product4 = new Product("D", 30 , "Lorem Ipsum", "nophoto", "Subscription", "threeMonth" )
// const product5 = new Product("E", 25 , "Lorem Ipsum", "nophoto", "Subscription", "onYear" )

