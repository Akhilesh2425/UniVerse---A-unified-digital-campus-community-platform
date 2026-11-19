import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getConnectionStatus } from './config/db.js';
import { errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import discussionRoutes from './routes/discussionRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import adminIssueRoutes from './routes/adminIssueRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import discoveryRoutes from './routes/discoveryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import formRoutes from './routes/formRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

app.set('trust proxy', 1);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  const isHealthy = dbStatus.isConnected;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'UniVerse REST API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin/issues', adminIssueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/discover', discoveryRoutes);
app.use('/api/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;
