const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');
const User = require('../models/User');

// Authenticate: verify JWT and attach user info (id, role, email)
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No token or wrong format. Header:', authHeader);
    return res.status(401).json({ message: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  console.log('[Auth] Token received (first 20 chars):', token ? token.substring(0, 20) + '...' : 'EMPTY');
  try {
    const decoded = jwt.verify(token, jwtSecret);
    // load user from DB to get email and latest role
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      console.log('[Auth] Token valid but user not found for id:', decoded.id);
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }
    console.log('[Auth] Authenticated user:', user.email, 'role:', user.role);
    req.user = { id: user._id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (err) {
    console.log('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};
