const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

exports.getAttendance = async (req, res) => {
  try {
    const date = req.query.date || getTodayString();
    const records = await Attendance.find({ gymId: req.user.gymId, date }).sort({ checkInTime: -1 });

    const currentlyInGym = records.filter((r) => r.status === 'in_gym').length;
    const completed = records.filter((r) => r.status === 'completed').length;

    return res.json({
      success: true,
      date,
      summary: {
        total: records.length,
        currentlyInGym,
        completed,
      },
      data: records,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance.', error: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required.' });
    }

    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const today = getTodayString();

    // Check if active checkin exists today
    const existing = await Attendance.findOne({
      gymId: req.user.gymId,
      memberId: member._id,
      date: today,
    });

    if (existing && existing.status === 'in_gym') {
      return res.status(400).json({
        success: false,
        message: `${member.name} is already checked in.`,
        data: existing,
      });
    }

    const record = await Attendance.create({
      gymId: req.user.gymId,
      memberId: member._id,
      memberName: member.name,
      memberPhone: member.phone,
      date: today,
      checkInTime: new Date(),
      status: 'in_gym',
    });

    return res.status(201).json({
      success: true,
      message: `${member.name} checked in successfully.`,
      data: record,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to check in.', error: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { memberId, attendanceId } = req.body;
    const query = { gymId: req.user.gymId };

    if (attendanceId) {
      query._id = attendanceId;
    } else if (memberId) {
      query.memberId = memberId;
      query.date = getTodayString();
      query.status = 'in_gym';
    } else {
      return res.status(400).json({ success: false, message: 'Specify attendanceId or memberId.' });
    }

    const record = await Attendance.findOne(query);
    if (!record) {
      return res.status(404).json({ success: false, message: 'No active check-in record found to check out.' });
    }

    record.checkOutTime = new Date();
    record.status = 'completed';
    await record.save();

    return res.json({
      success: true,
      message: `${record.memberName} checked out successfully.`,
      data: record,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to check out.', error: err.message });
  }
};

exports.toggleCheckIn = async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required.' });
    }

    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const today = getTodayString();
    const existing = await Attendance.findOne({
      gymId: req.user.gymId,
      memberId: member._id,
      date: today,
    });

    if (!existing) {
      // Check in
      const record = await Attendance.create({
        gymId: req.user.gymId,
        memberId: member._id,
        memberName: member.name,
        memberPhone: member.phone,
        date: today,
        checkInTime: new Date(),
        status: 'in_gym',
      });
      return res.json({
        success: true,
        action: 'check_in',
        message: `${member.name} checked in.`,
        data: record,
      });
    }

    if (existing.status === 'in_gym') {
      // Check out
      existing.checkOutTime = new Date();
      existing.status = 'completed';
      await existing.save();
      return res.json({
        success: true,
        action: 'check_out',
        message: `${member.name} checked out.`,
        data: existing,
      });
    }

    // If completed already today, re-open check-in
    existing.checkInTime = new Date();
    existing.checkOutTime = null;
    existing.status = 'in_gym';
    await existing.save();

    return res.json({
      success: true,
      action: 're_check_in',
      message: `${member.name} re-checked in.`,
      data: existing,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle attendance.', error: err.message });
  }
};
