import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB, closeDB } from './src/config/db.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    await connectDB();

    let server = null;
    let retries = 0;
    const maxRetries = 5;

    const bindPort = () => {
      server = app.listen(PORT, () => {
        console.log(`[UniVerse Server] Listening on http://localhost:${PORT}`);
        console.log(`[UniVerse Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          if (retries < maxRetries) {
            retries++;
            console.warn(`[UniVerse Server] Port ${PORT} busy, waiting 1s for socket release (attempt ${retries}/${maxRetries})...`);
            setTimeout(bindPort, 1000);
            return;
          }
          console.error(`\n[UniVerse Server Error] Port ${PORT} is still in use after ${maxRetries} attempts.`);
          console.error(`[UniVerse Server Error] To resolve:`);
          console.error(`  1. Terminate any previous process holding port ${PORT}`);
          console.error(`  2. Or change PORT in server/.env\n`);
        } else {
          console.error(`[UniVerse Server Error] Server error: ${err.message}`);
        }
        process.exit(1);
      });
    };

    bindPort();

    // Graceful shutdown handling for standard termination
    const shutdown = async (signal) => {
      console.log(`\n[UniVerse Server] Received ${signal}. Shutting down gracefully...`);
      if (server) {
        server.close(async () => {
          await closeDB();
          console.log('[UniVerse Server] HTTP server and database connections closed.');
          process.exit(0);
        });
      } else {
        await closeDB();
        process.exit(0);
      }

      // Force exit if hanging
      setTimeout(() => {
        console.error('[UniVerse Server] Forceful shutdown initiated due to timeout.');
        process.exit(1);
      }, 3000);
    };

    // Standard signals
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Nodemon restart signal handling (SIGUSR2)
    process.once('SIGUSR2', async () => {
      if (server) {
        server.close(async () => {
          await closeDB();
          process.kill(process.pid, 'SIGUSR2');
        });
      } else {
        process.kill(process.pid, 'SIGUSR2');
      }
    });

    // Prevent uncaught errors from crashing silently
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[UniVerse Server] Unhandled Promise Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('[UniVerse Server] Uncaught Exception:', err.message);
    });

  } catch (error) {
    console.error(`[UniVerse Server] Fatal startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
