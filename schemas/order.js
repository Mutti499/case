const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled'],
    default: 'Pending'
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  paymentType: {
    type: String,
    enum: ['oneTime', 'Subscription'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  receiptUrl: {
    type: String
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
