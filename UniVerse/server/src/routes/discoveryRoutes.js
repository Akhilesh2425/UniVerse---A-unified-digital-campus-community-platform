import express from 'express';
import { getCampusDiscovery } from '../controllers/discoveryController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getCampusDiscovery);

export default router;
