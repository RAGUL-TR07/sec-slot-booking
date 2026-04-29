'use strict';

const bookingService = require('../services/booking.service');
const { sendSuccess } = require('../utils/helpers');

const bookingController = {
  /**
   * POST /api/v1/bookings
   */
  async create(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.user._id, req.body);
      return sendSuccess(res, { booking }, 'Booking created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/bookings/my
   */
  async getMyBookings(req, res, next) {
    try {
      const { page, limit, status, sort } = req.query;
      const result = await bookingService.getMyBookings(req.user._id, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        status,
        sort,
      });
      return sendSuccess(res, result, 'Bookings retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/bookings/:id
   */
  async getById(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(
        req.params.id,
        req.user._id,
        req.user.role,
      );
      return sendSuccess(res, { booking }, 'Booking retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/bookings/:id
   */
  async cancel(req, res, next) {
    try {
      const result = await bookingService.cancelBooking(
        req.params.id,
        req.user._id,
        req.user.role,
      );
      return sendSuccess(res, result, 'Booking cancelled');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = bookingController;
