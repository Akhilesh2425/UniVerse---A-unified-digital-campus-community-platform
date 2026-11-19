import express from 'express';
import { searchGlobal } from '../controllers/searchController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, searchGlobal);

export default router;
