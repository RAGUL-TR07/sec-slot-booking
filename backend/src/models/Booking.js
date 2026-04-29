'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      unique: true,
      default: () => `BKG-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeSlot',
      required: [true, 'Slot is required'],
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    seatRow: {
      type: String,
      required: [true, 'Seat row is required'],
      trim: true,
      uppercase: true,
    },
    seatColumn: {
      type: String,
      required: [true, 'Seat column is required'],
      trim: true,
    },
    seatLabel: {
      type: String,
      required: [true, 'Seat label is required'],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'completed', 'cancelled'],
        message: 'Status must be one of: upcoming, completed, cancelled',
      },
      default: 'upcoming',
      index: true,
    },
    // Encrypted QR payload (HMAC signed JSON)
    qrPayload: {
      type: String,
    },
    // When QR was scanned/verified
    qrVerifiedAt: {
      type: Date,
    },
    // Admin who validated the QR
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Reason for cancellation
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ─── CRITICAL INDEXES ─────────────────────────────────────────────────────────
// Compound unique index: prevents double booking of same seat at same slot
bookingSchema.index(
  { slotId: 1, seatLabel: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } },
);

// Prevent same student booking same slot twice
bookingSchema.index(
  { studentId: 1, slotId: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } },
);

// Index for querying by user or slot status

// Admin reporting queries
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ subjectId: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
