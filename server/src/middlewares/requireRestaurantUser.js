import logger from '../utils/logger.js';

const restaurantRoles = ['restaurant_owner', 'restaurant_staff'];

const requireRestaurantUser = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!restaurantRoles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    if (!req.user.restaurantId) return res.status(400).json({ message: 'Missing restaurant context' });
    // attach restaurantId for convenience
    req.restaurantId = req.user.restaurantId;
    next();
  } catch (err) {
    logger.error('requireRestaurantUser_error', { message: err.message });
    res.status(500).json({ message: 'Internal error' });
  }
};

export default requireRestaurantUser;
