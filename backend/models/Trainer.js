const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'Fitness Trainer',
      trim: true,
    },
    specialization: {
      type: String,
      default: 'Strength & Conditioning',
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
    },
    assignedMembersCount: {
      type: Number,
      default: 0,
    },
    shift: {
      type: String,
      default: 'Morning (06:00 AM - 02:00 PM)',
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

trainerSchema.index({ gymId: 1, status: 1 });

module.exports = mongoose.model('Trainer', trainerSchema);
