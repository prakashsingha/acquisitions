import jwt from 'jsonwebtoken';
import logger from '#config/logger.js';
import { cookies } from '#utils/cookies.js';

const jwtSecret = () => process.env.JWT_SECRET || 'default_secret';

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export const authenticateToken = (req, res, next) => {
  const token = cookies.get(req, 'token') || getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret());
    req.user = {
      id: Number(payload.id),
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    logger.warn('Invalid or expired token', { error: error.message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
