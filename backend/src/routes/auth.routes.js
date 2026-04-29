'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// Strict rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/auth/login
router.post(
  '/login',
  loginLimiter,
  validate(schemas.loginSchema),
  authController.login,
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validate(schemas.refreshTokenSchema),
  authController.refresh,
);

// POST /api/v1/auth/logout  (requires auth)
router.post('/logout', protect, authController.logout);

// GET /api/v1/auth/me  (requires auth)
router.get('/me', protect, authController.getMe);

module.exports = router;
