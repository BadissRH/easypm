const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const chatbotController = require('../controllers/chatbotController');

/**
 * @route POST /api/chatbot
 * @desc Process a message with the Gemini AI chatbot for EasyPM
 * @access Authenticated users only
 */
router.post('/', authMiddleware, chatbotController.processMessage);

module.exports = router;