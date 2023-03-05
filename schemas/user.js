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
  adresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adress'
  }],
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }]

});

module.exports = mongoose.model('User', userSchema);

