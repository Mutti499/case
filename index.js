const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const User = require('./schemas/user');
const Address = require('./schemas/address');
const Subscription = require('./schemas/subscription');
const Order = require('./schemas/order');


const userRouter = require('./routes/users.js');

const dbURL =  'mongodb://127.0.0.1:27017/CAMP' ||  process.env.DB_URL
mongoose.connect(dbURL, {
    useNewUrlParser : true,
    useUnifiedTopology: true
})
mongoose.connection.on("error", console.error.bind(console, "connecttion error" ))
mongoose.connection.once("open", ()=>{console.log("Databese Connected")})

app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use('/api', userRouter);



// create a new order with Subscription payment type
const createMonthlyOrder = async (user, subscription) => {
  const order = new Order(subscription.amount, user, user.defaultAddress, 'Subscription', subscription);
  await order.save();
}

// set up cron job to create a new order every month
cron.schedule('0 0 1 * *', async () => {
  // get all active subscriptions
  const currentDate = new Date();
  const subscriptions = await Subscription.find({ 
    endDate: { $gte: currentDate },
    isActive: true
  });

  for (const subscription of subscriptions) {
    const user = await User.findById(subscription.user);

    // check if an order has already been made this month
    const lastOrder = await Order.findOne({ 
      user: user._id,
      paymentType: 'Subscription',
      subscription: subscription._id,
      createdAt: { 
        $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 
        $lte: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0) 
      }
    });

    if (!lastOrder) {
      await createMonthlyOrder(user, subscription);
    }
  }
});


app.get("/", (req,res)=>{
    res.send("HELLO")
})
  

app.listen(3000, () => {
    console.log(`Serving on port 3000`)
})