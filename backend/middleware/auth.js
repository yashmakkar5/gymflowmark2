const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'gymflow_super_secure_jwt_secret_key_2026';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No valid Bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    // Attach user and strictly verified gymId to request
    req.user = {
      id: user._id,
      gymId: user.gymId,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    req.gymId = user.gymId;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session.',
      error: err.message,
    });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Insufficient permissions for this action.',
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize, JWT_SECRET };
