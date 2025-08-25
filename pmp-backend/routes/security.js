const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/securityController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.get('/logs', authMiddleware, roleMiddleware(['Administrator']), getLogs);

module.exports = router;