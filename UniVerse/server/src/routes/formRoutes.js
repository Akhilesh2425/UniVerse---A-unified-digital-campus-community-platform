import express from 'express';
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlistReminder,
  runRemindersManual,
} from '../controllers/formController.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getForms);
router.get('/wishlist', authenticate, getMyWishlist);
router.post('/reminders/run', authenticate, requireAdmin, runRemindersManual);
router.post('/reminders/trigger', authenticate, requireAdmin, runRemindersManual);
router.post('/', authenticate, requireAdmin, createForm);

router.get('/:id', optionalAuthenticate, getFormById);
router.patch('/:id', authenticate, updateForm);
router.delete('/:id', authenticate, deleteForm);

router.post('/:id/wishlist', authenticate, addToWishlist);
router.delete('/:id/wishlist', authenticate, removeFromWishlist);
router.patch('/:id/wishlist/reminder', authenticate, toggleWishlistReminder);
router.patch('/:id/wishlist/reminders', authenticate, toggleWishlistReminder);

export default router;
