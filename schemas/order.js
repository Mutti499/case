const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled'],
    default: 'Pending'
  },
  // subscription: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Subscription',
  //   required: true
  // },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adress',
    required: true
  },
  // paymentIntentId: {
  //   type: String
  // },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String
  },
  receiptUrl: {
    type: String
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
