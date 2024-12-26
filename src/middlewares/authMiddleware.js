const { verifyToken } = require('../utils/paseto');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) {
      return res.status(403).json({ message: 'Access denied, no token provided' });
    }

    const decoded = await verifyToken(token); 
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
