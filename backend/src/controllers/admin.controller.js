'use strict';

const subjectService = require('../services/subject.service');
const slotService = require('../services/slot.service');
const roomService = require('../services/room.service');
const bookingService = require('../services/booking.service');
const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/helpers');

const adminController = {
  // ─── Dashboard ──────────────────────────────────────────────────────────────
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      return sendSuccess(res, { stats }, 'Dashboard stats retrieved');
    } catch (err) {
      next(err);
    }
  },

  // ─── Subjects ───────────────────────────────────────────────────────────────
  async getSubjects(req, res, next) {
    try {
      const result = await subjectService.getAll(req.query);
      return sendSuccess(res, result, 'Subjects retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createSubject(req, res, next) {
    try {
      const subject = await subjectService.create(req.body);
      return sendSuccess(res, { subject }, 'Subject created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateSubject(req, res, next) {
    try {
      const subject = await subjectService.update(req.params.id, req.body);
      return sendSuccess(res, { subject }, 'Subject updated');
    } catch (err) {
      next(err);
    }
  },

  async deleteSubject(req, res, next) {
    try {
      const { id } = req.params;
      console.log(`[DEBUG] Attempting to delete subject with ID: ${id}`);
      
      const result = await subjectService.delete(id);
      
      console.log(`[DEBUG] Subject deletion result:`, result);
      return sendSuccess(res, result, 'Subject deleted');
    } catch (err) {
      console.error(`[DEBUG] Subject deletion failed for ID ${req.params.id}:`, err.message);
      next(err);
    }
  },

  // ─── Slots ──────────────────────────────────────────────────────────────────
  async getSlots(req, res, next) {
    try {
      const result = await slotService.getAll(req.query);
      return sendSuccess(res, result, 'Slots retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createSlot(req, res, next) {
    try {
      const slot = await slotService.create(req.body);
      return sendSuccess(res, { slot }, 'Slot created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateSlot(req, res, next) {
    try {
      const slot = await slotService.update(req.params.id, req.body);
      return sendSuccess(res, { slot }, 'Slot updated');
    } catch (err) {
      next(err);
    }
  },

  async deleteSlot(req, res, next) {
    try {
      const result = await slotService.delete(req.params.id);
      return sendSuccess(res, result, 'Slot deleted');
    } catch (err) {
      next(err);
    }
  },

  // ─── Rooms ──────────────────────────────────────────────────────────────────
  async getRooms(req, res, next) {
    try {
      const result = await roomService.getAll(req.query);
      return sendSuccess(res, result, 'Rooms retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createRoom(req, res, next) {
    try {
      const room = await roomService.create(req.body);
      return sendSuccess(res, { room }, 'Room created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateRoom(req, res, next) {
    try {
      const room = await roomService.update(req.params.id, req.body);
      return sendSuccess(res, { room }, 'Room updated');
    } catch (err) {
      next(err);
    }
  },

  async deleteRoom(req, res, next) {
    try {
      const result = await roomService.delete(req.params.id);
      return sendSuccess(res, result, 'Room deleted');
    } catch (err) {
      next(err);
    }
  },

  // ─── QR Validation ──────────────────────────────────────────────────────────
  async validateQr(req, res, next) {
    try {
      const { qrData } = req.body;
      const booking = await bookingService.validateQr(qrData, req.user._id);
      return sendSuccess(res, { booking }, 'QR validated. Attendance recorded.');
    } catch (err) {
      next(err);
    }
  },

  // ─── Reports ────────────────────────────────────────────────────────────────
  async getReports(req, res, next) {
    try {
      const reports = await adminService.getReports();
      return sendSuccess(res, reports, 'Reports generated');
    } catch (err) {
      next(err);
    }
  },

  async getAllBookings(req, res, next) {
    try {
      const result = await adminService.getAllBookings(req.query);
      return sendSuccess(res, result, 'All bookings retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getStudents(req, res, next) {
    try {
      const result = await adminService.getStudents(req.query);
      return sendSuccess(res, result, 'Students retrieved');
    } catch (err) {
      next(err);
    }
  },

  async exportBookings(req, res, next) {
    try {
      const format = (req.query.format || 'csv').toLowerCase();
      const { bookings } = await adminService.getAllBookings({
        ...req.query,
        limit: 10000,
        page: 1,
      });

      const rows = bookings.map((b) => ({
        bookingRef: b.bookingRef,
        studentName: b.studentId?.name ?? '',
        studentRefNumber: b.studentId?.refNumber ?? '',
        studentDepartment: b.studentId?.department ?? '',
        subjectCode: b.subjectId?.code ?? '',
        subjectName: b.subjectId?.name ?? '',
        date: b.slotId?.date ?? '',
        startTime: b.slotId?.startTime ?? '',
        endTime: b.slotId?.endTime ?? '',
        room: b.roomId?.name ?? '',
        building: b.roomId?.building ?? '',
        seatLabel: b.seatLabel,
        status: b.status,
        qrVerifiedAt: b.qrVerifiedAt ?? '',
        cancelledAt: b.cancelledAt ?? '',
        bookedAt: b.createdAt,
      }));

      if (format === 'csv') {
        const headers = Object.keys(rows[0] || {}).join(',');
        const csvRows = rows.map((r) =>
          Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
        );
        const csv = [headers, ...csvRows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="bookings-${Date.now()}.csv"`);
        return res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="bookings-${Date.now()}.json"`);
        return res.json(rows);
      }
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
