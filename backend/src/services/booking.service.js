'use strict';

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const TimeSlot = require('../models/TimeSlot');
const Room = require('../models/Room');
const Subject = require('../models/Subject');
const { createError } = require('../middleware/errorHandler');
const { createQrPayload } = require('../utils/qr');
const { paginationMeta, parseSortString } = require('../utils/helpers');
const logger = require('../config/logger');
const { getIO } = require('../socket');

class BookingService {
  /**
   * Create a booking with MongoDB transaction for atomicity.
   * Prevents race conditions via atomic findOneAndUpdate on availableSeats.
   */
  async createBooking(studentId, { subjectId, slotId, roomId, seatLabel }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ── 1. Validate the slot ──────────────────────────────────────────────
      const slot = await TimeSlot.findOne({
        _id: slotId,
        isActive: true,
      }).session(session);

      if (!slot) {
        throw createError('Slot not found or is no longer active', 404);
      }

      // ── 2. Verify slot is for the correct subject and room ────────────────
      if (slot.subjectId.toString() !== subjectId) {
        throw createError('Slot does not belong to the specified subject', 400);
      }
      if (slot.roomId.toString() !== roomId) {
        throw createError('Slot does not belong to the specified room', 400);
      }

      // ── 3. Validate the room and seat label ───────────────────────────────
      const room = await Room.findById(roomId).session(session);
      if (!room || !room.isActive) {
        throw createError('Room not found or inactive', 404);
      }

      const validLabels = room.generateSeatLabels();
      const normalizedSeat = seatLabel.toUpperCase().trim();

      if (!validLabels.includes(normalizedSeat)) {
        throw createError(`Seat "${normalizedSeat}" does not exist in this room`, 400);
      }
      if (room.blockedSeats.includes(normalizedSeat)) {
        throw createError(`Seat "${normalizedSeat}" is blocked`, 400);
      }

      // ── 4. Parse seat row/column from label (e.g., "B3" → row="B", col="3") ─
      const seatRow = normalizedSeat.match(/^[A-Z]+/)[0];
      const seatColumn = normalizedSeat.match(/\d+$/)[0];

      // ── 5. Check if slot has available seats ──────────────────────────────
      if (slot.availableSeats <= 0) {
        throw createError('No available seats in this slot', 409);
      }

      // ── 6. Atomic seat decrement (prevents race condition) ─────────────────
      // This atomically checks availability and decrements in one operation
      const updatedSlot = await TimeSlot.findOneAndUpdate(
        {
          _id: slotId,
          isActive: true,
          availableSeats: { $gt: 0 },
        },
        {
          $inc: {
            availableSeats: -1,
            bookedSeats: 1,
          },
        },
        { new: true, session },
      );

      if (!updatedSlot) {
        throw createError(
          'No seats available or slot became inactive. Please try again.',
          409,
        );
      }

      // ── 7. Create the booking ─────────────────────────────────────────────
      const bookingData = {
        studentId,
        subjectId,
        slotId,
        roomId,
        seatRow,
        seatColumn,
        seatLabel: normalizedSeat,
        status: 'upcoming',
      };

      // Generate QR payload (temp — needs bookingRef which is auto-set)
      const [booking] = await Booking.create([bookingData], { session });

      // Generate QR with the actual bookingRef
      booking.qrPayload = createQrPayload(booking);
      await booking.save({ session });

      // ── 8. Commit transaction ─────────────────────────────────────────────
      await session.commitTransaction();
      logger.info(`Booking created: ${booking.bookingRef} by student ${studentId}`);

      // Return with populated fields
      const populated = await Booking.findById(booking._id)
        .populate('subjectId', 'code name department')
        .populate('slotId', 'date startTime endTime')
        .populate('roomId', 'name building floor');

      const result = populated.toJSON();
      
      // Emit socket events
      try {
        const io = getIO();
        io.emit('booking_created', result);
        io.emit('slot_updated', { slotId, action: 'seat_booked' });
      } catch (err) {
        logger.error('Socket emission failed', err);
      }

      return result;
    } catch (err) {
      await session.abortTransaction();

      // Handle MongoDB duplicate key for seat (concurrent booking)
      if (err.code === 11000) {
        if (err.keyPattern?.slotId && err.keyPattern?.seatLabel) {
          throw createError(
            'This seat was just booked by someone else. Please select a different seat.',
            409,
          );
        }
        if (err.keyPattern?.studentId && err.keyPattern?.slotId) {
          throw createError(
            'You already have a booking for this slot.',
            409,
          );
        }
      }

      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all bookings for a student with pagination.
   */
  async getMyBookings(studentId, { page = 1, limit = 20, status, sort = '-createdAt' }) {
    const filter = { studentId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const sortObj = parseSortString(sort);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('subjectId', 'code name department')
        .populate('slotId', 'date startTime endTime')
        .populate('roomId', 'name building floor'),
      Booking.countDocuments(filter),
    ]);

    return {
      bookings: bookings.map((b) => b.toJSON()),
      meta: paginationMeta(total, page, limit),
    };
  }

  /**
   * Get a single booking by ID (student can only see their own).
   */
  async getBookingById(bookingId, userId, role) {
    const booking = await Booking.findById(bookingId)
      .populate('subjectId', 'code name department')
      .populate('slotId', 'date startTime endTime')
      .populate('roomId', 'name building floor')
      .populate('studentId', 'name refNumber email department');

    if (!booking) {
      throw createError('Booking not found', 404);
    }

    // Students can only see their own bookings
    if (role === 'student' && booking.studentId._id.toString() !== userId.toString()) {
      throw createError('Access denied', 403);
    }

    return booking.toJSON();
  }

  /**
   * Cancel a booking. Only upcoming bookings can be cancelled.
   * Atomically restores the seat count.
   */
  async cancelBooking(bookingId, userId, role) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        throw createError('Booking not found', 404);
      }

      // Students can only cancel their own bookings
      if (role === 'student' && booking.studentId.toString() !== userId.toString()) {
        throw createError('You can only cancel your own bookings', 403);
      }

      if (booking.status !== 'upcoming') {
        throw createError(
          `Cannot cancel a booking with status: ${booking.status}`,
          400,
        );
      }

      // Update booking to cancelled
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      await booking.save({ session });

      // Restore seat to the slot
      await TimeSlot.findByIdAndUpdate(
        booking.slotId,
        { $inc: { availableSeats: 1, bookedSeats: -1 } },
        { session },
      );

      await session.commitTransaction();
      logger.info(`Booking cancelled: ${booking.bookingRef}`);

      try {
        const io = getIO();
        io.emit('booking_cancelled', { bookingId, slotId: booking.slotId });
        io.emit('slot_updated', { slotId: booking.slotId, action: 'seat_freed' });
      } catch (err) {
        logger.error('Socket emission failed', err);
      }

      return { message: 'Booking cancelled successfully' };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Validate a QR code and mark booking as completed.
   * Called by admin scanner.
   */
  async validateQr(qrData, adminId) {
    const { verifyQrPayload } = require('../utils/qr');

    // Verify the QR payload signature
    let payload;
    try {
      payload = verifyQrPayload(qrData);
    } catch (err) {
      throw createError(`QR validation failed: ${err.message}`, 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await Booking.findOne({ bookingRef: payload.bookingRef })
        .session(session)
        .populate('studentId', 'name refNumber department')
        .populate('subjectId', 'code name')
        .populate('slotId', 'date startTime endTime')
        .populate('roomId', 'name building');

      if (!booking) {
        throw createError('Booking not found for this QR code', 404);
      }

      if (booking.status === 'cancelled') {
        throw createError('This booking has been cancelled', 400);
      }

      if (booking.status === 'completed') {
        throw createError('QR code already used. Attendance already recorded.', 409);
      }

      // If not manual, verify QR belongs to correct student and slot
      if (!payload.isManual) {
        if (booking.studentId._id.toString() !== payload.studentId) {
          throw createError('QR code does not match the booking student', 400);
        }
        if (booking.slotId._id.toString() !== payload.slotId) {
          throw createError('QR code does not match the booking slot', 400);
        }
      }

      // Mark as completed
      booking.status = 'completed';
      booking.qrVerifiedAt = new Date();
      booking.verifiedBy = adminId;
      await booking.save({ session });

      await session.commitTransaction();
      logger.info(`QR validated for booking: ${booking.bookingRef} by admin ${adminId}`);

      return booking.toJSON();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get seat map for a room and slot.
   * Returns a map of seatLabel → status ('available'|'booked'|'blocked')
   */
  async getSeatMap(roomId, slotId) {
    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      throw createError('Room not found or inactive', 404);
    }

    const allLabels = room.generateSeatLabels();
    const seatMap = {};

    // Initially all available
    for (const label of allLabels) {
      seatMap[label] = 'available';
    }

    // Mark physically blocked seats
    for (const label of room.blockedSeats) {
      if (seatMap[label] !== undefined) {
        seatMap[label] = 'blocked';
      }
    }

    // If slotId provided, mark booked seats
    if (slotId) {
      const bookedBookings = await Booking.find({
        slotId,
        status: { $ne: 'cancelled' },
      }).select('seatLabel');

      for (const b of bookedBookings) {
        if (seatMap[b.seatLabel] !== undefined) {
          seatMap[b.seatLabel] = 'booked';
        }
      }
    }

    return seatMap;
  }
}

module.exports = new BookingService();
