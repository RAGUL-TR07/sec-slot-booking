'use strict';

const subjectService = require('../services/subject.service');
const slotService = require('../services/slot.service');
const bookingService = require('../services/booking.service');
const { sendSuccess } = require('../utils/helpers');

const studentController = {
  /**
   * GET /api/v1/subjects
   * Returns active subjects for booking flow
   */
  async getSubjects(req, res, next) {
    try {
      const result = await subjectService.getAll({
        ...req.query,
        isActive: true,
      });
      return sendSuccess(res, result, 'Subjects retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/slots?subjectId=
   * Returns active slots for a subject
   */
  async getSlots(req, res, next) {
    try {
      const result = await slotService.getAll({
        ...req.query,
        isActive: true,
      });
      return sendSuccess(res, result, 'Slots retrieved');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/rooms/:id/seat-map?slotId=
   */
  async getSeatMap(req, res, next) {
    try {
      const { id: roomId } = req.params;
      const { slotId } = req.query;
      const seatMap = await bookingService.getSeatMap(roomId, slotId);
      return sendSuccess(res, seatMap, 'Seat map retrieved');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = studentController;
