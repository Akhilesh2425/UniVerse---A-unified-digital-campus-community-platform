import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { getConnectionStatus } from './config/db.js';
import { errorHandler } from './middleware/error.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import discussionRoutes from './routes/discussionRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';

const app = express();

// Trust proxy if deployed behind reverse proxy
app.set('trust proxy', 1);

// Configure CORS for single-origin with credentials
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers with sensible size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Accurate Health Check Endpoint
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

// Mount application routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/moderation', moderationRoutes);

// Catch-all 404 handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
