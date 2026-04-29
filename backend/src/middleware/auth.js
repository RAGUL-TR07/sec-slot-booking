'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('./errorHandler');

/**
 * Protects routes by verifying the JWT access token.
 * Attaches req.user after successful verification.
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Authorization token is required', 401));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(createError('Authorization token is required', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(createError('Access token expired', 401));
      }
      return next(createError('Invalid access token', 401));
    }

    // Fetch fresh user from DB to ensure active status
    const user = await User.findById(decoded.userId).select('+isActive');

    if (!user) {
      return next(createError('User not found. Token may be invalid.', 401));
    }

    if (!user.isActive) {
      return next(createError('Your account has been deactivated. Contact admin.', 403));
    }

    // Attach user + token metadata to request
    req.user = user;
    req.tokenPayload = decoded;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-Based Access Control middleware factory.
 * Usage: rbac('admin') or rbac('student', 'admin')
 */
function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        createError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          403,
        ),
      );
    }

    next();
  };
}

/**
 * Ensure the authenticated user is accessing their own resource
 * OR is an admin.
 */
function ownerOrAdmin(req, res, next) {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  const targetId = req.params.userId || req.params.studentId;

  if (req.user.role === 'admin' || req.user._id.toString() === targetId) {
    return next();
  }

  return next(createError('Access denied. You can only access your own resources.', 403));
}

module.exports = { protect, rbac, ownerOrAdmin };
