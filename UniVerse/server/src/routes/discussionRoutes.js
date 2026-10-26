import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  getMyDiscussions,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  setAcceptedAnswer,
  voteDiscussion,
  removeVoteDiscussion,
  saveDiscussion,
  unsaveDiscussion,
  getSavedDiscussions,
  reportContent,
} from '../controllers/discussionController.js';

const router = express.Router();

// Specific routes registered before parameterized /:postId to prevent route collisions
router.get('/', optionalAuthenticate, getDiscussions);
router.post('/', authenticate, createDiscussion);

router.get('/my-posts', authenticate, getMyDiscussions);
router.get('/saved', authenticate, getSavedDiscussions);

// Post detail, edit, delete
router.get('/:postId', optionalAuthenticate, getDiscussionById);
router.patch('/:postId', authenticate, updateDiscussion);
router.delete('/:postId', authenticate, deleteDiscussion);

// Comments and answers
router.get('/:postId/comments', optionalAuthenticate, getComments);
router.post('/:postId/comments', authenticate, createComment);
router.patch('/:postId/comments/:commentId', authenticate, updateComment);
router.delete('/:postId/comments/:commentId', authenticate, deleteComment);
router.patch('/:postId/accepted-answer', authenticate, setAcceptedAnswer);

// Voting
router.post('/:postId/vote', authenticate, voteDiscussion);
router.delete('/:postId/vote', authenticate, removeVoteDiscussion);

// Bookmarking / Saving
router.post('/:postId/save', authenticate, saveDiscussion);
router.delete('/:postId/save', authenticate, unsaveDiscussion);

// Reporting
router.post('/:postId/report', authenticate, reportContent);
router.post('/:postId/comments/:commentId/report', authenticate, reportContent);

export default router;
