const jwt = require('jsonwebtoken');

// Middleware to verify JWT token or session
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      req.user = decoded;
      req.user.id = decoded.id;
      next();
    });
  } else if (req.session?.userId) {
    // Allow session-based authentication (for OAuth callbacks)
    req.user = { id: req.session.userId };
    next();
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};

module.exports = { verifyToken };
