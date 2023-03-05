const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['threeMonth','oneMonth', 'Default'],
    default: 'Default'
  },
  // name: {
  //   type: String,
  //   required: true
  // },
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
    required: true
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
