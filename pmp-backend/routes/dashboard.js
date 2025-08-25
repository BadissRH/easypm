const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { getStats, getUserTasks, getUserProjects, getUserNotifications } = require('../controllers/dashboardController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/stats', authMiddleware, roleMiddleware(['Administrator', 'Project Manager']), getStats);

router.get(
  '/users/:userId/tasks',
  [
    authMiddleware,
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  getUserTasks
);

router.get(
  '/users/:userId/projects',
  [
    authMiddleware,
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  getUserProjects
);

router.get(
  '/users/:userId/notifications',
  [
    authMiddleware,
    param('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  getUserNotifications
);

module.exports = router;