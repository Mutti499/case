const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const User = require('./user');
const Address = require('./adress');
const Subscription = require('./subscription');
const Order = require('./order');

const dbURL =  'mongodb://127.0.0.1:27017/CAMP' || process.env.DB_URL || 'mongodb://127.0.0.1:27017/CAMP'
mongoose.connect(dbURL, {
    useNewUrlParser : true,
    useUnifiedTopology: true
})
mongoose.connection.on("error", console.error.bind(console, "connecttion error" ))
mongoose.connection.once("open", ()=>{console.log("Databese Connected")})





app.listen(3000, () => {
    console.log(`Serving on port 3000`)
})