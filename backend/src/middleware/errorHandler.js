'use strict';

const logger = require('../config/logger');

/**
 * Centralized error handler middleware.
 * Must be registered AFTER all routes.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // ─── Mongoose Validation Error ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ─── Mongoose CastError (invalid ObjectId) ────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // ─── MongoDB Duplicate Key Error ──────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}. This record already exists.`;
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ─── CORS Error ───────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS policy')) {
    statusCode = 403;
    message = err.message;
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${req.method} ${req.path} - ${message}`, { err });
  } else {
    logger.warn(`[${statusCode}] ${req.method} ${req.path} - ${message}`);
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}

/**
 * 404 handler - for unmatched routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Utility to create an operational error.
 */
function createError(message, statusCode = 500, errors = null) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  if (errors) err.errors = errors;
  return err;
}

module.exports = { errorHandler, notFoundHandler, createError };
