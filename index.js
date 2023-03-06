const express = require('express');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const ExpressError = require("./utils/ExpressError");

const cron = require('node-cron');//cron schedule works in 
const stripe = require('stripe')(process.env.STRIPE_KEY);

const order = require('./controller/order');

const User = require('./schemas/user');
const Subscription = require('./schemas/subscription');
const Order = require('./schemas/order');


const userRouter = require('./routes/users.js');
const { connect } = require('./mongose');

const dbURL = "mongodb://127.0.0.1:27017/case" || process.env.DB_URL;
connect(dbURL)
  .then(() => {console.log("Database connected");})
  .catch((error) => {console.error("Error connecting to database:", error);});

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.use('/user', userRouter);


// set up cron job to create a new order every month
// cron.schedule('0 0 1 * *', async () => { It works monthly but customers may want orders in the other days of the month so service should be working every midnight
cron.schedule('0 0 * * *', async () => {

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
      await order.createMonthlyOrder(user, subscription);
    }
  }
});


app.all("*", (req,res,next) =>{
  next(new ExpressError("This Page is Not Found!", 404));
});

app.use((err,req,res,next) =>{
  const { message="Something Went Wrong!" , statusCode=500 } = err;
  console.log(err);
  res.send(message, statusCode)
});

app.listen(3000, () => {
    console.log(`Serving on port 3000`)
})