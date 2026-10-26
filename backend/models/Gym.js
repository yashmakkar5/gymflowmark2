const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: 'Plot 42, Hiranandani Gardens, Powai',
    },
    city: {
      type: String,
      default: 'Mumbai',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    gstin: {
      type: String,
      default: '27AAACG0561K1Z2',
    },
    settings: {
      gracePeriodDays: { type: Number, default: 3 },
      requireCheckinApproval: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gym', gymSchema);
