const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    memberPhone: {
      type: String,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Cash', 'Card', 'NetBanking'],
      default: 'UPI',
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed'],
      default: 'paid',
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ gymId: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
