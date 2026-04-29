'use strict';

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [100, 'Room name must not exceed 100 characters'],
    },
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor is required'],
      min: [0, 'Floor must be at least 0'],
    },
    rows: {
      type: Number,
      required: [true, 'Number of rows is required'],
      min: [1, 'Rows must be at least 1'],
      max: [26, 'Rows must not exceed 26 (A–Z)'],
    },
    columns: {
      type: Number,
      required: [true, 'Number of columns is required'],
      min: [1, 'Columns must be at least 1'],
      max: [50, 'Columns must not exceed 50'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    // Optional: override specific seat labels to block them (e.g., pillars)
    blockedSeats: {
      type: [String],
      default: [],
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
        return ret;
      },
    },
  },
);

// ─── Pre-save: auto-compute capacity ─────────────────────────────────────────
roomSchema.pre('save', function (next) {
  this.capacity = this.rows * this.columns;
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
roomSchema.index({ building: 1, floor: 1 });
roomSchema.index({ isActive: 1, name: 1 });

// ─── Instance Methods ─────────────────────────────────────────────────────────
/**
 * Generate the full seat label list for this room.
 * e.g. rows=2, columns=3 => ['A1','A2','A3','B1','B2','B3']
 */
roomSchema.methods.generateSeatLabels = function () {
  const labels = [];
  for (let r = 0; r < this.rows; r++) {
    const rowChar = String.fromCharCode(65 + r); // A, B, C, ...
    for (let c = 1; c <= this.columns; c++) {
      labels.push(`${rowChar}${c}`);
    }
  }
  return labels;
};

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
