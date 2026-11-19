import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/image', authenticate, uploadImage);

export default router;
