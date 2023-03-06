const mongoose = require('mongoose');

const productSchame = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
  },
  image_URL: {
    type: String,
  },
  paymentType: {
    type: String,
    enum: ['oneTime', 'Subscription'],
    required: true
  },
  options: {
    type: String,
    enum: ['threeMonth','oneMonth', 'onYear', "noSub"],
  },
});

module.exports = mongoose.model('Product', productSchame);
