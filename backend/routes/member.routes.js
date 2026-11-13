const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', memberController.getMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', memberController.createMember);
router.patch('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);
router.post('/:id/renew', memberController.renewMembership);
router.post('/:id/avatar', upload.single('avatar'), memberController.uploadAvatar);

module.exports = router;
