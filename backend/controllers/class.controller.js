const Class = require('../models/Class');
const Trainer = require('../models/Trainer');

exports.getClasses = async (req, res) => {
  try {
    const { dayOfWeek } = req.query;
    const query = { gymId: req.user.gymId };
    if (dayOfWeek && dayOfWeek !== 'all') {
      query.dayOfWeek = dayOfWeek;
    }

    const classes = await Class.find(query).sort({ dayOfWeek: 1, time: 1 });
    return res.json({ success: true, data: classes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch classes.', error: err.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { name, trainerId, dayOfWeek, time, capacity } = req.body;

    if (!name || !dayOfWeek || !time) {
      return res.status(400).json({ success: false, message: 'Class name, day of week, and time are required.' });
    }

    let trainerName = 'Unassigned';
    if (trainerId) {
      const trainer = await Trainer.findOne({ _id: trainerId, gymId: req.user.gymId });
      if (trainer) trainerName = trainer.name;
    }

    const newClass = await Class.create({
      gymId: req.user.gymId,
      name,
      trainerId: trainerId || null,
      trainerName,
      dayOfWeek,
      time,
      capacity: Number(capacity) || 20,
      bookedSeats: 0,
      status: 'scheduled',
    });

    return res.status(201).json({ success: true, message: 'Class created successfully.', data: newClass });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create class.', error: err.message });
  }
};

exports.bookSeat = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    if (cls.bookedSeats >= cls.capacity) {
      return res.status(400).json({ success: false, message: 'Class is already at full capacity.' });
    }

    cls.bookedSeats += 1;
    await cls.save();

    return res.json({ success: true, message: `Seat booked for ${cls.name}`, data: cls });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to book seat.', error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    if (cls.bookedSeats > 0) {
      cls.bookedSeats -= 1;
      await cls.save();
    }

    return res.json({ success: true, message: 'Seat released.', data: cls });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to release seat.', error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const cls = await Class.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }
    return res.json({ success: true, message: 'Class deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete class.', error: err.message });
  }
};
