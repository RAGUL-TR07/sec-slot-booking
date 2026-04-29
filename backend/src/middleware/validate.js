'use strict';

const Joi = require('joi');
const { createError } = require('./errorHandler');

/**
 * Middleware factory for validating request body, query, or params using Joi.
 * @param {Joi.Schema} schema - Joi schema
 * @param {string} source - 'body' | 'query' | 'params'
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body
                : source === 'query' ? req.query
                : req.params;

    const { error, value } = schema.validate(data, {
      abortEarly: false,     // collect all errors, not just first
      stripUnknown: true,    // remove unknown fields
      convert: true,         // allow type coercion (string '123' -> number 123)
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return next(createError('Validation failed', 400, errors));
    }

    // Replace data with validated+sanitized value
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else req.params = value;

    next();
  };
}

// ─── Reusable Schemas ─────────────────────────────────────────────────────────

const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message('Must be a valid MongoDB ObjectId');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().max(100).default('-createdAt'),
  search: Joi.string().max(200).optional().allow(''),
});

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
const loginSchema = Joi.object({
  refNumber: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Reference number is required',
    'any.required': 'Reference number is required',
  }),
  password: Joi.string().min(4).max(100).required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ─── Subject Schemas ──────────────────────────────────────────────────────────
const createSubjectSchema = Joi.object({
  code: Joi.string().min(2).max(20).required(),
  name: Joi.string().min(2).max(200).required(),
  department: Joi.string().min(2).max(100).required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  description: Joi.string().max(500).optional().allow(''),
  isActive: Joi.boolean().default(true),
});

const updateSubjectSchema = Joi.object({
  code: Joi.string().min(2).max(20).optional(),
  name: Joi.string().min(2).max(200).optional(),
  department: Joi.string().min(2).max(100).optional(),
  semester: Joi.number().integer().min(1).max(8).optional(),
  description: Joi.string().max(500).optional().allow(''),
  isActive: Joi.boolean().optional(),
}).min(1);

// ─── Room Schemas ─────────────────────────────────────────────────────────────
const createRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  building: Joi.string().min(1).max(100).required(),
  floor: Joi.number().integer().min(0).required(),
  rows: Joi.number().integer().min(1).max(26).required(),
  columns: Joi.number().integer().min(1).max(50).required(),
  blockedSeats: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
});

const updateRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  building: Joi.string().min(1).max(100).optional(),
  floor: Joi.number().integer().min(0).optional(),
  rows: Joi.number().integer().min(1).max(26).optional(),
  columns: Joi.number().integer().min(1).max(50).optional(),
  blockedSeats: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

// ─── Slot Schemas ─────────────────────────────────────────────────────────────
const createSlotSchema = Joi.object({
  subjectId: objectIdSchema.required(),
  roomId: objectIdSchema.required(),
  date: Joi.date().iso().min('now').required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  isActive: Joi.boolean().default(true),
});

const updateSlotSchema = Joi.object({
  subjectId: objectIdSchema.optional(),
  roomId: objectIdSchema.optional(),
  date: Joi.date().iso().optional(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

// ─── Booking Schemas ──────────────────────────────────────────────────────────
const createBookingSchema = Joi.object({
  subjectId: objectIdSchema.required(),
  slotId: objectIdSchema.required(),
  roomId: objectIdSchema.required(),
  seatLabel: Joi.string().min(2).max(10).uppercase().required().messages({
    'string.empty': 'Seat label is required',
    'any.required': 'Seat label is required',
  }),
});

const validateQrSchema = Joi.object({
  qrData: Joi.string().min(10).required().messages({
    'string.empty': 'QR data is required',
    'any.required': 'QR data is required',
  }),
});

// ─── Param Schemas ────────────────────────────────────────────────────────────
const idParamSchema = Joi.object({
  id: objectIdSchema.required(),
});

module.exports = {
  validate,
  schemas: {
    loginSchema,
    refreshTokenSchema,
    createSubjectSchema,
    updateSubjectSchema,
    createRoomSchema,
    updateRoomSchema,
    createSlotSchema,
    updateSlotSchema,
    createBookingSchema,
    validateQrSchema,
    paginationSchema,
    idParamSchema,
  },
};
