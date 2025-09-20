const express = require('express');
const router = express.Router();
const materiasController = require('../controllers/materiasController');
const { protegerRota } = require('../middleware/authMiddleware');

router.get('/', protegerRota, materiasController.listarMaterias);

module.exports = router;