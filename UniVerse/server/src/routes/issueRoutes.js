import express from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  getMyReports,
  supportIssue,
  removeSupport,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  submitFeedback,
  createReopenRequest,
} from '../controllers/issueController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getIssues);
router.post('/', authenticate, createIssue);

router.get('/my-reports', authenticate, getMyReports);

router.get('/:issueId', optionalAuthenticate, getIssueById);

router.post('/:issueId/support', authenticate, supportIssue);
router.delete('/:issueId/support', authenticate, removeSupport);

router.get('/:issueId/comments', optionalAuthenticate, getComments);
router.post('/:issueId/comments', authenticate, createComment);
router.patch('/:issueId/comments/:commentId', authenticate, updateComment);
router.delete('/:issueId/comments/:commentId', authenticate, deleteComment);

router.post('/:issueId/feedback', authenticate, submitFeedback);
router.post('/:issueId/reopen-requests', authenticate, createReopenRequest);

export default router;
