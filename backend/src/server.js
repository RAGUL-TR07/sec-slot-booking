'use strict';
// Trigger reload

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./db/connection');
const logger = require('./config/logger');
const socket = require('./socket');

const PORT = process.env.PORT || 5000;

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
let server;

async function startServer() {
  try {
    await connectDB();
    const mongoose = require('mongoose');
    logger.info(`DB NAME: ${mongoose.connection.name}`);
    const httpServer = http.createServer(app);
    socket.init(httpServer);
    server = httpServer.listen(PORT, () => {
      logger.info(`🚀 SEC Slot Booking Backend running on port ${PORT}`);
      logger.info(`📌 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  }
});

startServer();
