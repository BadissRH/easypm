const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { getProjectLogs, getAllProjectLogs } = require('../controllers/projectLogsController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Get logs for a specific project
router.get(
  '/projects/:projectId/logs',
  [
    authMiddleware,
    param('projectId').isMongoId().withMessage('Invalid project ID'),
  ],
  validate,
  getProjectLogs
);

// Get all project logs (admin only)
router.get(
  '/logs',
  [
    authMiddleware,
    roleMiddleware(['Administrator']),
  ],
  getAllProjectLogs
);

module.exports = router;