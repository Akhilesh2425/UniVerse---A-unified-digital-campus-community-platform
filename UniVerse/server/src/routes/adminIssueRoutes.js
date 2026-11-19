import express from 'express';
import {
  getAdminIssues,
  getAdminStatistics,
  updateIssueStatus,
  updateIssuePriority,
  assignDepartment,
  addIssueUpdate,
  resolveIssue,
  closeIssue,
  getReopenRequests,
  reviewReopenRequest,
  getIssueAuditHistory,
} from '../controllers/adminIssueController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/statistics', getAdminStatistics);

router.get('/reopen-requests', getReopenRequests);

router.get('/', getAdminIssues);

router.patch('/:issueId/status', updateIssueStatus);
router.patch('/:issueId/priority', updateIssuePriority);
router.patch('/:issueId/assignment', assignDepartment);
router.post('/:issueId/updates', addIssueUpdate);
router.post('/:issueId/resolve', resolveIssue);
router.post('/:issueId/close', closeIssue);
router.patch('/:issueId/reopen-requests/:requestId', reviewReopenRequest);
router.get('/:issueId/history', getIssueAuditHistory);

export default router;
