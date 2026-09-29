const jwt = require('jsonwebtoken');

// Middleware to verify JWT token from Authorization header
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if header is provided and starts with Bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bidlive_secret_key');
    req.user = decoded; // Attach user info (id, role, name) to request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
