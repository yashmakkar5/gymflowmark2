const Trainer = require('../models/Trainer');
const Member = require('../models/Member');

exports.getTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find({ gymId: req.user.gymId }).sort({ name: 1 });

    // Update assigned members count
    const trainersWithCounts = await Promise.all(
      trainers.map(async (t) => {
        const count = await Member.countDocuments({ gymId: req.user.gymId, assignedTrainer: t._id });
        const obj = t.toObject();
        obj.assignedMembersCount = count;
        return obj;
      })
    );

    return res.json({ success: true, data: trainersWithCounts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch trainers.', error: err.message });
  }
};

exports.createTrainer = async (req, res) => {
  try {
    const { name, role, specialization, phone, email, shift, status } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Trainer name and phone are required.' });
    }

    const trainer = await Trainer.create({
      gymId: req.user.gymId,
      name,
      role: role || 'Fitness Coach',
      specialization: specialization || 'Strength Training',
      phone,
      email: email || '',
      shift: shift || 'Morning (06:00 AM - 02:00 PM)',
      status: status || 'active',
    });

    return res.status(201).json({ success: true, message: 'Trainer created successfully.', data: trainer });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create trainer.', error: err.message });
  }
};

exports.updateTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    const { name, role, specialization, phone, email, shift, status } = req.body;
    if (name) trainer.name = name;
    if (role) trainer.role = role;
    if (specialization) trainer.specialization = specialization;
    if (phone) trainer.phone = phone;
    if (email !== undefined) trainer.email = email;
    if (shift) trainer.shift = shift;
    if (status) trainer.status = status;

    await trainer.save();

    return res.json({ success: true, message: 'Trainer updated successfully.', data: trainer });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update trainer.', error: err.message });
  }
};

exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }
    return res.json({ success: true, message: 'Trainer deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete trainer.', error: err.message });
  }
};
