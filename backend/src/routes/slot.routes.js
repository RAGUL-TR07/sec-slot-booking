'use strict';

const express = require('express');
const studentController = require('../controllers/student.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/v1/slots?subjectId= - Slots for a subject
router.get('/', studentController.getSlots);

module.exports = router;
