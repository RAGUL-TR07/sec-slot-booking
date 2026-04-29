'use strict';

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/helpers');

const authController = {
  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { refNumber, password } = req.body;
      const result = await authService.login(refNumber, password);

      return sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);

      return sendSuccess(res, tokens, 'Tokens refreshed');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      await authService.logout(req.user._id);
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user._id);
      return sendSuccess(res, { user }, 'User profile retrieved');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
