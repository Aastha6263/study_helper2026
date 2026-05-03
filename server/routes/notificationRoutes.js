import express from 'express';
import {
  createNotificationHandler,
  createBulkNotificationHandler,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  registerFcmToken,
  removeFcmToken,
  subscribeToTopicHandler,
  unsubscribeFromTopicHandler,
  updateNotificationPrefs,
  getNotificationStats,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// ── My notifications ──────────────────────────────────────────────────────────
router.get('/',              getMyNotifications);
router.get('/unread-count',  getUnreadCount);
router.get('/stats',         getNotificationStats);

// ── Read / delete ─────────────────────────────────────────────────────────────
router.patch('/read-all',    markAllAsRead);
router.delete('/read',       deleteAllRead);
router.patch('/:id/read',    markAsRead);
router.delete('/:id',        deleteNotification);

// ── Push (Firebase) ───────────────────────────────────────────────────────────
router.post('/fcm/register',    registerFcmToken);
router.delete('/fcm/remove',    removeFcmToken);
router.post('/fcm/subscribe',   subscribeToTopicHandler);
router.post('/fcm/unsubscribe', unsubscribeFromTopicHandler);

// ── Preferences ───────────────────────────────────────────────────────────────
router.put('/preferences', updateNotificationPrefs);

// ── Create (teacher / system use) ────────────────────────────────────────────
router.post('/',
  authorize('teacher'), createNotificationHandler);

router.post('/bulk',
  authorize('teacher'), createBulkNotificationHandler);

export default router;