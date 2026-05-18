import logger from '#config/logger.js';
import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';
    let limit;

    switch (role) {
      case 'admin':
        limit = 100;
        break;
      case 'user':
        limit = 10;
        break;
      default:
        limit = 5;
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);
    console.log('Arcjet decision', decision);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('No bots allowed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      res.status(403).json({ error: 'Automated requests are not allowed' });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Too many requests', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Request rate limit exceeded',
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      res.status(403).json({ error: 'Shield blocked request' });
    }

    if (decision.isDenied() && decision.reason.isSpam()) {
      logger.warn('Spam blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
    }
    next();
  } catch (error) {
    logger.error('Arcjet middleware error', { error: error.message });
    res
      .status(500)
      .json({ error: 'Internal server error', message: error.message });
  }
};

export default securityMiddleware;
