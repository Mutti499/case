const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  options: {
    type: String,
    enum: ['threeMonth','oneMonth', 'onYear'],
    required : true
  },
  amount: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
