import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // All user profile routes require authentication

router.get('/me', getProfile);
router.patch('/me', updateProfile);

export default router;
