const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', memberController.getMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', memberController.createMember);
router.patch('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);
router.post('/:id/renew', memberController.renewMembership);

module.exports = router;
