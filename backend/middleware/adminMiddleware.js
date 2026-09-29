// Middleware to restrict route access only to admin users
const adminMiddleware = (req, res, next) => {
  // Check if req.user exists and has 'admin' role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }

  next();
};

module.exports = adminMiddleware;
