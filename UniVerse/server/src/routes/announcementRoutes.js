import express from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public / student discovery
router.get('/', optionalAuthenticate, getAnnouncements);
router.get('/:id', optionalAuthenticate, getAnnouncementById);

// Administrator-only management routes
router.post('/', authenticate, requireAdmin, createAnnouncement);
router.patch('/:id', authenticate, requireAdmin, updateAnnouncement);
router.delete('/:id', authenticate, requireAdmin, deleteAnnouncement);

export default router;
