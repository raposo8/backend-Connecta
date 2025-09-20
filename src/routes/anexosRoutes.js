const express = require('express');
const router = express.Router({ mergeParams: true });
const anexosController = require('../controllers/anexosController');
const { protegerRota, isGroupMember } = require('../middleware/authMiddleware');

router.post('/', protegerRota, isGroupMember, anexosController.uploadAnexo);

module.exports = router;