const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', reportController.getReports);

module.exports = router;
