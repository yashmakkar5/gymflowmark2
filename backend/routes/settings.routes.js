const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.patch('/profile', settingsController.updateGymProfile);
router.post('/users', authorize('owner', 'manager'), settingsController.createUser);

module.exports = router;
