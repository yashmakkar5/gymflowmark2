const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    memberCode: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    planName: {
      type: String,
      default: 'Standard',
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    membershipStartDate: {
      type: Date,
      default: Date.now,
    },
    membershipEndDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'expiring_soon', 'expired', 'inactive'],
      default: 'active',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'paid',
    },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Method to recalculate status dynamically based on current date
memberSchema.methods.computeStatus = function () {
  const now = new Date();
  const end = new Date(this.membershipEndDate);
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    this.status = 'expired';
  } else if (diffDays <= 7) {
    this.status = 'expiring_soon';
  } else {
    this.status = 'active';
  }
  return this.status;
};

memberSchema.index({ gymId: 1, phone: 1 });
memberSchema.index({ gymId: 1, status: 1 });
memberSchema.index({ gymId: 1, name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Member', memberSchema);
