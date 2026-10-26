import express from 'express';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getMyGroups,
  getGroupMembers,
  getJoinRequests,
  reviewJoinRequest,
  updateMemberRole,
  removeMember,
  getGroupPosts,
  createGroupPost,
  updateGroupPost,
  deleteGroupPost,
  getPostComments,
  createPostComment,
  updatePostComment,
  deletePostComment,
} from '../controllers/groupController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// 1. Discovery and My Groups
router.get('/', optionalAuthenticate, getGroups);
router.get('/my', authenticate, getMyGroups); // Must be before /:id
router.post('/', authenticate, createGroup);

// 2. Individual Group Details and Management
router.get('/:id', optionalAuthenticate, getGroupById);
router.patch('/:id', authenticate, updateGroup);
router.delete('/:id', authenticate, deleteGroup);

// 3. Membership & Join Requests
router.post('/:id/join', authenticate, joinGroup);
router.delete('/:id/membership', authenticate, leaveGroup);
router.get('/:id/members', optionalAuthenticate, getGroupMembers);
router.get('/:id/join-requests', authenticate, getJoinRequests);
router.patch('/:id/join-requests/:requestId', authenticate, reviewJoinRequest);
router.patch('/:id/members/:userId/role', authenticate, updateMemberRole);
router.delete('/:id/members/:userId', authenticate, removeMember);

// 4. Group Discussions & Posts
router.get('/:id/posts', optionalAuthenticate, getGroupPosts);
router.post('/:id/posts', authenticate, createGroupPost);
router.patch('/:id/posts/:postId', authenticate, updateGroupPost);
router.delete('/:id/posts/:postId', authenticate, deleteGroupPost);

// 5. Comments on Posts
router.get('/:id/posts/:postId/comments', optionalAuthenticate, getPostComments);
router.post('/:id/posts/:postId/comments', authenticate, createPostComment);
router.patch('/:id/posts/:postId/comments/:commentId', authenticate, updatePostComment);
router.delete('/:id/posts/:postId/comments/:commentId', authenticate, deletePostComment);

export default router;
