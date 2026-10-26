import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
} from '../controllers/eventController.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public / student discovery routes (optional auth allows reading user's registration status)
router.get('/', optionalAuthenticate, getEvents);

// Authenticated student routes
// Place /my-registrations BEFORE /:id to prevent route collision
router.get('/my-registrations', authenticate, getMyRegistrations);
router.get('/:id', optionalAuthenticate, getEventById);

router.post('/:id/register', authenticate, registerForEvent);
router.delete('/:id/register', authenticate, cancelRegistration);

// Administrator-only event management routes
router.post('/', authenticate, requireAdmin, createEvent);
router.patch('/:id', authenticate, requireAdmin, updateEvent);
router.delete('/:id', authenticate, requireAdmin, deleteEvent);
router.get('/:id/registrations', authenticate, requireAdmin, getEventAttendees);

export default router;
