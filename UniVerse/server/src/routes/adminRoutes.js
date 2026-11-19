import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getDashboardOverview,
  getDashboardActivity,
  getDashboardAnalytics,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard/overview', getDashboardOverview);
router.get('/dashboard/activity', getDashboardActivity);
router.get('/dashboard/analytics', getDashboardAnalytics);

router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/role', updateUserRole);

router.get('/audit-logs', getAuditLogs);

export default router;
