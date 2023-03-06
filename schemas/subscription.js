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
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stripeSubscriptionId: {
    type: String 
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
