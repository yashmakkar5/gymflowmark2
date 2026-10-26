const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
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
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in_gym', 'completed'],
      default: 'in_gym',
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ gymId: 1, date: 1, memberId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
