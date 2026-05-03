import Notification          from '../models/Notification.js';
import User                  from '../models/User.js';
import { createNotification,
         createBulkNotifications } from '../services/notificationService.js';
import { subscribeToTopic,
         unsubscribeFromTopic }    from '../config/firebase.js';

// ── Create notification (internal / admin) ────────────────────────────────────
export const createNotificationHandler = async (req, res) => {
  try {
    const {
      recipientId, type, title, message,
      link, priority, meta, channels, expiresIn,
    } = req.body;

    if (!recipientId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'recipientId, type, title, and message are required.',
      });
    }

    const notification = await createNotification({
      recipientId,
      senderId:  req.user._id,
      type,
      title,
      message,
      link:      link      || null,
      priority:  priority  || 'medium',
      meta:      meta      || {},
      channels:  channels  || { inApp: true, email: false, push: false },
      expiresIn: expiresIn || null,
    });

    if (!notification) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create notification.',
      });
    }

    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Bulk create ───────────────────────────────────────────────────────────────
export const createBulkNotificationHandler = async (req, res) => {
  try {
    const { recipientIds, type, title, message, link, priority, meta, channels } = req.body;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'recipientIds array is required.',
      });
    }

    const result = await createBulkNotifications(recipientIds, {
      senderId: req.user._id,
      type,
      title,
      message,
      link:     link     || null,
      priority: priority || 'medium',
      meta:     meta     || {},
      channels: channels || { inApp: true, email: false, push: false },
    });

    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get my notifications ──────────────────────────────────────────────────────
export const getMyNotifications = async (req, res) => {
  try {
    const {
      page    = 1,
      limit   = 20,
      isRead,
      type,
      priority,
    } = req.query;

    const filter = {
      recipient: req.user._id,
      isDeleted: false,
    };

    if (isRead !== undefined) filter.isRead    = isRead === 'true';
    if (type)                 filter.type      = type;
    if (priority)             filter.priority  = priority;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sender', 'name avatar role');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isDeleted: false,
      isRead:    false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get unread count only ─────────────────────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isDeleted: false,
      isRead:    false,
    });
    res.status(200).json({ success: true, unreadCount: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Mark single notification as read ─────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id:       req.params.id,
      recipient: req.user._id,
      isDeleted: false,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await notification.markRead();

    res.status(200).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Mark all as read ──────────────────────────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false, isDeleted: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success:  true,
      message:  `${result.modifiedCount} notification(s) marked as read.`,
      modified: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete single notification (soft) ────────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id:       req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await notification.softDelete();

    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete all read notifications ─────────────────────────────────────────────
export const deleteAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: true, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    res.status(200).json({
      success:  true,
      message:  `${result.modifiedCount} notification(s) deleted.`,
      deleted:  result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Register FCM token (push setup) ──────────────────────────────────────────
export const registerFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'fcmToken is required.' });
    }

    await User.findByIdAndUpdate(req.user._id, { $set: { fcmToken } });

    res.status(200).json({
      success: true,
      message: 'FCM token registered. Push notifications enabled.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Remove FCM token (opt out of push) ───────────────────────────────────────
export const removeFcmToken = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { fcmToken: '' } });

    res.status(200).json({
      success: true,
      message: 'FCM token removed. Push notifications disabled.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Subscribe to topic (e.g. when joining a room) ────────────────────────────
export const subscribeToTopicHandler = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: 'topic is required.' });
    }

    const user = await User.findById(req.user._id).select('fcmToken');

    if (!user?.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'No FCM token registered. Register a token first.',
      });
    }

    const result = await subscribeToTopic([user.fcmToken], topic);

    res.status(200).json({
      success: result.success,
      message: result.success
        ? `Subscribed to topic: ${topic}`
        : `Failed to subscribe: ${result.reason}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Unsubscribe from topic ────────────────────────────────────────────────────
export const unsubscribeFromTopicHandler = async (req, res) => {
  try {
    const { topic } = req.body;

    const user = await User.findById(req.user._id).select('fcmToken');

    if (!user?.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'No FCM token found.',
      });
    }

    const result = await unsubscribeFromTopic([user.fcmToken], topic);

    res.status(200).json({
      success: result.success,
      message: result.success
        ? `Unsubscribed from topic: ${topic}`
        : `Failed: ${result.reason}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update notification preferences ──────────────────────────────────────────
export const updateNotificationPrefs = async (req, res) => {
  try {
    const { email, inApp, push } = req.body;

    const prefs = {};
    if (email !== undefined) prefs['notificationPrefs.email'] = email;
    if (inApp !== undefined) prefs['notificationPrefs.inApp'] = inApp;
    if (push  !== undefined) prefs['notificationPrefs.push']  = push;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: prefs },
      { new: true }
    ).select('notificationPrefs');

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated.',
      notificationPrefs: user.notificationPrefs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get notification stats ────────────────────────────────────────────────────
export const getNotificationStats = async (req, res) => {
  try {
    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments({ recipient: req.user._id, isDeleted: false }),
      Notification.countDocuments({ recipient: req.user._id, isDeleted: false, isRead: false }),
      Notification.aggregate([
        { $match: { recipient: req.user._id, isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 }, unread: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        }}},
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: { total, unread, byType },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};