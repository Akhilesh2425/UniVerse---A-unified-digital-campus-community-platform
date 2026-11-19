import express from 'express';
import {
  getClubs,
  getClubById,
  submitClubProposal,
  getMyClubProposals,
  getAllClubProposals,
  reviewClubProposal,
  joinClub,
  leaveClub,
  getClubMembers,
  updateMemberPosition,
  createClubEvent,
  getClubEvents,
} from '../controllers/clubController.js';
import { authenticate, optionalAuthenticate, requireAdmin, requireMainAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getClubs);
router.get('/my-proposals', authenticate, getMyClubProposals);
router.get('/admin/proposals', authenticate, requireAdmin, getAllClubProposals);
router.get('/proposals', authenticate, requireAdmin, getAllClubProposals);
router.patch('/admin/proposals/:proposalId/review', authenticate, requireMainAdmin, reviewClubProposal);
router.patch('/proposals/:proposalId/review', authenticate, requireMainAdmin, reviewClubProposal);
router.post('/proposals', authenticate, submitClubProposal);

router.get('/:id', optionalAuthenticate, getClubById);
router.post('/:id/join', authenticate, joinClub);
router.delete('/:id/membership', authenticate, leaveClub);
router.get('/:id/members', optionalAuthenticate, getClubMembers);
router.patch('/:id/members/:userId/position', authenticate, updateMemberPosition);
router.patch('/:id/members/:userId/role', authenticate, updateMemberPosition);

router.get('/:id/events', optionalAuthenticate, getClubEvents);
router.post('/:id/events', authenticate, createClubEvent);

export default router;
