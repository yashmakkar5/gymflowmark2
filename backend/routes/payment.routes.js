const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', paymentController.getPayments);
router.get('/:id/receipt', paymentController.getReceipt);
router.post('/', paymentController.createPayment);

module.exports = router;
