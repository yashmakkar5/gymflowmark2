const jwt = require('jsonwebtoken');
const Gym = require('../models/Gym');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      gymId: user.gymId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { gymName, ownerName, email, password, phone, city, address } = req.body;

    if (!gymName || !ownerName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Gym Name, Owner Name, Email, Password, and Phone.',
      });
    }

    const existingGym = await Gym.findOne({ email: email.toLowerCase() });
    if (existingGym) {
      return res.status(400).json({
        success: false,
        message: 'A gym with this email is already registered.',
      });
    }

    // 1. Create Gym tenant
    const gym = await Gym.create({
      name: gymName,
      ownerName,
      email: email.toLowerCase(),
      phone,
      city: city || 'Mumbai',
      address: address || 'Main Branch',
    });

    // 2. Create Owner User linked to this Gym
    const user = await User.create({
      gymId: gym._id,
      name: ownerName,
      email: email.toLowerCase(),
      password,
      role: 'owner',
      phone,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Gym created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      gym: {
        id: gym._id,
        name: gym.name,
        ownerName: gym.ownerName,
        email: gym.email,
        phone: gym.phone,
        currencySymbol: gym.currencySymbol || '₹',
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during gym registration.',
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const gym = await Gym.findById(user.gymId);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: 'Associated gym profile not found.',
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      gym: {
        id: gym._id,
        name: gym.name,
        ownerName: gym.ownerName,
        email: gym.email,
        phone: gym.phone,
        currencySymbol: gym.currencySymbol || '₹',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: err.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const gym = await Gym.findById(req.user.gymId);

    if (!user || !gym) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      gym: {
        id: gym._id,
        name: gym.name,
        ownerName: gym.ownerName,
        email: gym.email,
        phone: gym.phone,
        address: gym.address,
        city: gym.city,
        currencySymbol: gym.currencySymbol || '₹',
        gstin: gym.gstin,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};
