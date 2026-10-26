const Gym = require('../models/Gym');
const User = require('../models/User');

exports.getSettings = async (req, res) => {
  try {
    const [gym, users] = await Promise.all([
      Gym.findById(req.user.gymId),
      User.find({ gymId: req.user.gymId }).select('-password'),
    ]);

    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found.' });
    }

    return res.json({
      success: true,
      data: {
        gym,
        users,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.', error: err.message });
  }
};

exports.updateGymProfile = async (req, res) => {
  try {
    const gym = await Gym.findById(req.user.gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found.' });
    }

    const { name, ownerName, phone, email, address, city, currencySymbol, gstin, gracePeriodDays } = req.body;

    if (name) gym.name = name;
    if (ownerName) gym.ownerName = ownerName;
    if (phone) gym.phone = phone;
    if (email) gym.email = email.toLowerCase();
    if (address !== undefined) gym.address = address;
    if (city !== undefined) gym.city = city;
    if (currencySymbol) gym.currencySymbol = currencySymbol;
    if (gstin !== undefined) gym.gstin = gstin;
    if (gracePeriodDays !== undefined) {
      gym.settings = gym.settings || {};
      gym.settings.gracePeriodDays = Number(gracePeriodDays);
    }

    await gym.save();

    return res.json({
      success: true,
      message: 'Gym profile updated successfully.',
      data: gym,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ gymId: req.user.gymId, email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in your gym.' });
    }

    const user = await User.create({
      gymId: req.user.gymId,
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
      phone: phone || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Team member added successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create user.', error: err.message });
  }
};
