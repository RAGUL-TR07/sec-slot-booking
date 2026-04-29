'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ─── JWT Token Generation ─────────────────────────────────────────────────────

/**
 * Generate a JWT access token (short-lived).
 */
function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId: userId.toString(), role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' },
  );
}

/**
 * Generate a JWT refresh token (long-lived).
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' },
  );
}

/**
 * Verify a refresh token and return decoded payload.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

/**
 * Generate both access + refresh tokens.
 */
function generateTokenPair(userId, role) {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId),
  };
}

/**
 * Hash a refresh token before storing in DB.
 */
async function hashRefreshToken(token) {
  return bcrypt.hash(token, 8);
}

/**
 * Verify a raw refresh token against stored hash.
 */
async function verifyRefreshTokenHash(token, hash) {
  return bcrypt.compare(token, hash);
}

// ─── Standard Response Helpers ────────────────────────────────────────────────

/**
 * Send a standardized success response.
 */
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Pagination metadata helper.
 */
function paginationMeta(total, page, limit) {
  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/**
 * Parse sorting string like '-createdAt' or 'name,-date'.
 */
function parseSortString(sortStr) {
  if (!sortStr) return { createdAt: -1 };
  return sortStr.split(',').reduce((acc, field) => {
    if (field.startsWith('-')) {
      acc[field.slice(1)] = -1;
    } else {
      acc[field] = 1;
    }
    return acc;
  }, {});
}

// ─── Secure Random String ─────────────────────────────────────────────────────

function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenPair,
  hashRefreshToken,
  verifyRefreshTokenHash,
  sendSuccess,
  paginationMeta,
  parseSortString,
  randomHex,
};
