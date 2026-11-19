import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate);

router.get('/unread-count', getUnreadCount);

router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);

router.patch('/read-all', markAllNotificationsRead);

router.get('/', getMyNotifications);

router.patch('/:notificationId/read', markNotificationRead);
router.delete('/:notificationId', deleteNotification);

export default router;
