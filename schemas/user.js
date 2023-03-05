const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adress'
  }],
  subscriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  }], // User can have more than  one subscription plan 
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }]

});

module.exports = mongoose.model('User', userSchema);

