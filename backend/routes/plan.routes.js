const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', planController.getPlans);
router.post('/', planController.createPlan);
router.patch('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);

module.exports = router;
