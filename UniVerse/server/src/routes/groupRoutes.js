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
  generateGroupInvitation,
  getGroupInvitations,
  revokeGroupInvitation,
  inspectQrInvitation,
  joinViaQrInvitation,
  getGroupResources,
  createGroupResource,
  deleteGroupResource,
  getGroupActivities,
  createGroupActivity,
  updateGroupActivity,
  deleteGroupActivity,
  transferGroupOwnership,
  updateGroupEmailPreference,
} from '../controllers/groupController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getGroups);
router.get('/my', authenticate, getMyGroups); 
router.get('/join/qr/:token', optionalAuthenticate, inspectQrInvitation);
router.post('/join/qr/:token', authenticate, joinViaQrInvitation);
router.post('/', authenticate, createGroup);

router.get('/:id', optionalAuthenticate, getGroupById);
router.patch('/:id', authenticate, updateGroup);
router.delete('/:id', authenticate, deleteGroup);
router.patch('/:id/ownership', authenticate, transferGroupOwnership);
router.patch('/:id/email-preference', authenticate, updateGroupEmailPreference);

router.get('/:id/invitations', authenticate, getGroupInvitations);
router.post('/:id/invitations', authenticate, generateGroupInvitation);
router.delete('/:id/invitations/:inviteId', authenticate, revokeGroupInvitation);

router.get('/:id/resources', optionalAuthenticate, getGroupResources);
router.post('/:id/resources', authenticate, createGroupResource);
router.delete('/:id/resources/:resourceId', authenticate, deleteGroupResource);

router.get('/:id/activities', optionalAuthenticate, getGroupActivities);
router.post('/:id/activities', authenticate, createGroupActivity);
router.patch('/:id/activities/:activityId', authenticate, updateGroupActivity);
router.delete('/:id/activities/:activityId', authenticate, deleteGroupActivity);

router.post('/:id/join', authenticate, joinGroup);
router.delete('/:id/membership', authenticate, leaveGroup);
router.get('/:id/members', optionalAuthenticate, getGroupMembers);
router.get('/:id/join-requests', authenticate, getJoinRequests);
router.patch('/:id/join-requests/:requestId', authenticate, reviewJoinRequest);
router.patch('/:id/members/:userId/role', authenticate, updateMemberRole);
router.delete('/:id/members/:userId', authenticate, removeMember);

router.get('/:id/posts', optionalAuthenticate, getGroupPosts);
router.post('/:id/posts', authenticate, createGroupPost);
router.patch('/:id/posts/:postId', authenticate, updateGroupPost);
router.delete('/:id/posts/:postId', authenticate, deleteGroupPost);

router.get('/:id/posts/:postId/comments', optionalAuthenticate, getPostComments);
router.post('/:id/posts/:postId/comments', authenticate, createPostComment);
router.patch('/:id/posts/:postId/comments/:commentId', authenticate, updatePostComment);
router.delete('/:id/posts/:postId/comments/:commentId', authenticate, deletePostComment);

export default router;
