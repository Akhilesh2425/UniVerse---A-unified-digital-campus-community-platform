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

router.get('/', optionalAuthenticate, getEvents);

router.get('/my-registrations', authenticate, getMyRegistrations);
router.get('/:id', optionalAuthenticate, getEventById);

router.post('/:id/register', authenticate, registerForEvent);
router.delete('/:id/register', authenticate, cancelRegistration);

router.post('/', authenticate, requireAdmin, createEvent);
router.patch('/:id', authenticate, requireAdmin, updateEvent);
router.delete('/:id', authenticate, requireAdmin, deleteEvent);
router.get('/:id/registrations', authenticate, requireAdmin, getEventAttendees);

export default router;
