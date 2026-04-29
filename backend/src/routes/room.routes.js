'use strict';

const express = require('express');
const studentController = require('../controllers/student.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/v1/rooms/:id/seat-map?slotId=
router.get('/:id/seat-map', studentController.getSeatMap);

module.exports = router;
