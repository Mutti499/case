const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const User = require('./schemas/user');
const Address = require('./schemas/address');
const Subscription = require('./schemas/subscription');
const Order = require('./schemas/order');


const userRouter = require('./routes/users.js');

const dbURL =  'mongodb://127.0.0.1:27017/case' || process.env.DB_URL || 'mongodb://127.0.0.1:27017/CAMP'
mongoose.connect(dbURL, {
    useNewUrlParser : true,
    useUnifiedTopology: true
})
mongoose.connection.on("error", console.error.bind(console, "connecttion error" ))
mongoose.connection.once("open", ()=>{console.log("Databese Connected")})

app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use('/api', userRouter);


app.get("/", (req,res)=>{
    res.send("HELLO")
})
  

app.listen(3000, () => {
    console.log(`Serving on port 3000`)
})