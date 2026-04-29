'use strict';

const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');
const {
  generateTokenPair,
  verifyRefreshToken,
  hashRefreshToken,
  verifyRefreshTokenHash,
} = require('../utils/helpers');
const logger = require('../config/logger');

class AuthService {
  /**
   * Authenticate a student/admin by refNumber and password.
   * Returns user object + token pair.
   */
  async login(refNumber, password) {
    // Find user with password hash
    const user = await User.findOne({
      refNumber: refNumber.trim().toUpperCase(),
    }).select('+passwordHash +loginAttempts +lockUntil +refreshTokenHash');

    if (!user) {
      // Security: don't reveal whether the user exists
      throw createError('Invalid credentials', 401);
    }

    // Check account lockout
    if (user.isLocked) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      throw createError(
        `Account temporarily locked. Try again in ${lockMinutes} minute(s).`,
        423,
      );
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incLoginAttempts();
      const remainingAttempts = 5 - (user.loginAttempts + 1);
      throw createError(
        `Invalid credentials${remainingAttempts > 0 ? `. ${remainingAttempts} attempt(s) remaining.` : '. Account will be locked.'}`,
        401,
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw createError('Your account has been deactivated. Contact admin.', 403);
    }

    // Reset login attempts on success
    if (user.loginAttempts > 0) {
      await user.updateOne({
        $set: { loginAttempts: 0, lastLoginAt: new Date() },
        $unset: { lockUntil: 1 },
      });
    } else {
      await user.updateOne({ $set: { lastLoginAt: new Date() } });
    }

    // Generate token pair
    const tokens = generateTokenPair(user._id, user.role);

    // Store hashed refresh token
    const refreshHash = await hashRefreshToken(tokens.refreshToken);
    await user.updateOne({ $set: { refreshTokenHash: refreshHash } });

    logger.info(`User logged in: ${user.refNumber} (${user.role})`);

    return {
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Refresh tokens using a valid refresh token.
   */
  async refreshTokens(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw createError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.userId)
      .select('+refreshTokenHash +isActive');

    if (!user || !user.isActive) {
      throw createError('User not found or inactive', 401);
    }

    if (!user.refreshTokenHash) {
      throw createError('Refresh token has been revoked', 401);
    }

    // Verify the refresh token matches the stored hash (token rotation)
    const isValid = await verifyRefreshTokenHash(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      // Possible token reuse attack — revoke all tokens
      await user.updateOne({ $unset: { refreshTokenHash: 1 } });
      throw createError('Refresh token reuse detected. Please log in again.', 401);
    }

    // Issue new token pair (rotation)
    const tokens = generateTokenPair(user._id, user.role);
    const refreshHash = await hashRefreshToken(tokens.refreshToken);
    await user.updateOne({ $set: { refreshTokenHash: refreshHash } });

    return tokens;
  }

  /**
   * Revoke refresh token (logout).
   */
  async logout(userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Get current authenticated user profile.
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }
    return user.toJSON();
  }
}

module.exports = new AuthService();
