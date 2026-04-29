'use strict';

const express = require('express');
const studentController = require('../controllers/student.controller');
const { protect, rbac } = require('../middleware/auth');

const router = express.Router();

// All subject routes require authentication
router.use(protect);

// GET /api/v1/subjects - Active subjects for booking flow
router.get('/', studentController.getSubjects);

module.exports = router;
