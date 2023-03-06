const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  line1: {
    type: String,
    required: true
  },
  line2: {
    type: String,
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
  },
  postal_code: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});

module.exports = mongoose.model('Address', addressSchema);
