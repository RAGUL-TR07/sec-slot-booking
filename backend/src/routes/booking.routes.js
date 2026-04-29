'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const bookingController = require('../controllers/booking.controller');
const { protect, rbac } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// Booking rate limit - prevent rapid booking spam
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.BOOKING_RATE_LIMIT_MAX) || 5,
  message: { success: false, message: 'Too many booking attempts. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All booking routes require authentication
router.use(protect);

// GET /api/v1/bookings/my - Student's bookings
router.get('/my', rbac('student', 'admin'), bookingController.getMyBookings);

// POST /api/v1/bookings - Create a booking
router.post(
  '/',
  rbac('student'),
  bookingLimiter,
  validate(schemas.createBookingSchema),
  bookingController.create,
);

// GET /api/v1/bookings/:id - Single booking
router.get('/:id', bookingController.getById);

// DELETE /api/v1/bookings/:id - Cancel a booking
router.delete('/:id', rbac('student', 'admin'), bookingController.cancel);

module.exports = router;
