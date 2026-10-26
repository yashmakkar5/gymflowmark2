const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', attendanceController.getAttendance);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.post('/toggle', attendanceController.toggleCheckIn);

module.exports = router;
