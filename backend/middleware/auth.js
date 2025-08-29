const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Admin only access
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Check subscription limits
const checkSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user.subscription.plan === 'free' && user.subscription.interviewsRemaining <= 0) {
      return res.status(403).json({ 
        message: 'Interview limit reached. Please upgrade your subscription.',
        upgradeRequired: true
      });
    }

    if (user.subscription.plan !== 'free' && user.subscription.expiresAt < new Date()) {
      return res.status(403).json({ 
        message: 'Subscription expired. Please renew your subscription.',
        subscriptionExpired: true
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking subscription' });
  }
};

module.exports = { protect, admin, checkSubscription };
