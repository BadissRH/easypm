const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { getProjectReport } = require('../controllers/reportsController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get(
  '/:projectId',
  [
    authMiddleware,
    roleMiddleware(['Administrator', 'Project Manager']),
    param('projectId').isMongoId().withMessage('Invalid project ID'),
  ],
  validate,
  getProjectReport
);

module.exports = router;