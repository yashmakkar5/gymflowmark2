const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', classController.getClasses);
router.post('/', classController.createClass);
router.post('/:id/book', classController.bookSeat);
router.post('/:id/cancel', classController.cancelBooking);
router.delete('/:id', classController.deleteClass);

module.exports = router;
