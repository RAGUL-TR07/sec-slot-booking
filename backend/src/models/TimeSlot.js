'use strict';

const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats is required'],
      min: [0, 'Available seats cannot be negative'],
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: [0, 'Booked seats cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        // Convert date to ISO date string (date only)
        if (ret.date) {
          ret.date = ret.date instanceof Date
            ? ret.date.toISOString().split('T')[0]
            : ret.date;
        }
        return ret;
      },
    },
  },
);

// ─── Validation: endTime must be after startTime ──────────────────────────────
timeSlotSchema.pre('save', function (next) {
  const [sh, sm] = this.startTime.split(':').map(Number);
  const [eh, em] = this.endTime.split(':').map(Number);
  if (eh * 60 + em <= sh * 60 + sm) {
    return next(new Error('End time must be after start time'));
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
timeSlotSchema.index({ subjectId: 1, date: 1 });
timeSlotSchema.index({ roomId: 1, date: 1 });
timeSlotSchema.index({ date: 1, isActive: 1 });

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
module.exports = TimeSlot;
