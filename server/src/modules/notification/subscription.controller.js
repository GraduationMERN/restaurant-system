import Subscription from './subscription.model.js';

// Subscribe user to push notifications
export const subscribeToNotifications = async (req, res) => {
  try {
    const { endpoint, expirationTime, keys } = req.body;
    const userId = req.user?._id;

    if (!endpoint || !keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Save or update subscription
    const subscription = await Subscription.findOneAndUpdate(
      { endpoint, userId },
      {
        endpoint,
        expirationTime,
        keys,
        userId,
        active: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Subscribed to notifications',
      subscription
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromNotifications = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user?._id;

    await Subscription.findOneAndUpdate(
      { endpoint, userId },
      { active: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Unsubscribed from notifications'
    });
  } catch (error) {
    console.error('Unsubscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user?._id;

    const subscriptions = await Subscription.find({
      userId,
      active: true
    });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
};
