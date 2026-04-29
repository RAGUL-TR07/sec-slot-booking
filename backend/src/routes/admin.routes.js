'use strict';

const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, rbac } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// ALL admin routes require auth + admin role
router.use(protect, rbac('admin'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats);

// ─── Students ─────────────────────────────────────────────────────────────────
router.get('/students', adminController.getStudents);

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', validate(schemas.createSubjectSchema), adminController.createSubject);
router.put('/subjects/:id', validate(schemas.updateSubjectSchema), adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

// ─── Slots ────────────────────────────────────────────────────────────────────
router.get('/slots', adminController.getSlots);
router.post('/slots', validate(schemas.createSlotSchema), adminController.createSlot);
router.put('/slots/:id', validate(schemas.updateSlotSchema), adminController.updateSlot);
router.delete('/slots/:id', adminController.deleteSlot);

// ─── Rooms ────────────────────────────────────────────────────────────────────
router.get('/rooms', adminController.getRooms);
router.post('/rooms', validate(schemas.createRoomSchema), adminController.createRoom);
router.put('/rooms/:id', validate(schemas.updateRoomSchema), adminController.updateRoom);
router.delete('/rooms/:id', adminController.deleteRoom);

// ─── QR Validation ────────────────────────────────────────────────────────────
router.post(
  '/bookings/validate-qr',
  validate(schemas.validateQrSchema),
  adminController.validateQr,
);

// ─── Reports & Bookings ───────────────────────────────────────────────────────
router.get('/reports', adminController.getReports);
router.get('/reports/bookings', adminController.getAllBookings);
router.get('/reports/export', adminController.exportBookings);

module.exports = router;
