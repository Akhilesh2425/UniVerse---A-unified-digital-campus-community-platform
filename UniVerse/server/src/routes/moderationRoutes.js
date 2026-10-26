import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getReports, resolveReport } from '../controllers/moderationController.js';

const router = express.Router();

// All moderation routes require authenticated administrator privileges
router.use(authenticate, requireAdmin);

router.get('/reports', getReports);
router.patch('/reports/:reportId', resolveReport);

export default router;
