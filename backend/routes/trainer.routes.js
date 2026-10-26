const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainer.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', trainerController.getTrainers);
router.post('/', trainerController.createTrainer);
router.patch('/:id', trainerController.updateTrainer);
router.delete('/:id', trainerController.deleteTrainer);

module.exports = router;
