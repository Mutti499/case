const User = require('../schemas/user');
const Address = require('../schemas/address');
const Order = require('../schemas/order');
const Product = require('../schemas/product');
const Subscription = require('../schemas/subscription');
const stripe = require('stripe')(process.env.STRIPE_KEY);


const newOrder = async (req, res) => {

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
}


// create a new order with Subscription payment type
const createMonthlyOrder = async (user, subscription) => {

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const stripeInvoice = await stripe.invoices.create({
      customer: user.stripeCustomerId,
      subscription: stripeSubscription.id
    });
  
  
    const order = new Order({
      amount: subscription.amount,//This is quantity of the product
      user,
      price: subscription.price,
      address: user.defaultAddress,
      paymentType: 'Subscription',
      subscription,
    })
    order.receiptUrl = stripeInvoice.invoice_pdf || "https://website.com/receipts/" + order._id + ".pdf"
  
    order.products.push(subscription.product);
    await order.save();
  }



module.exports = {
    newOrder,
    createMonthlyOrder
}