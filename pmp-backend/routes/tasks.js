const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const { getTasks, createTask, updateTask, deleteTask, addComment, addAttachment, getRecentTasks } = require('../controllers/tasksController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get(
  '/projects/:projectId/tasks',
  [
    authMiddleware,
    param('projectId').isMongoId().withMessage('Invalid project ID'),
  ],
  validate,
  getTasks
);

// Get recent tasks for dashboard
router.get(
  '/tasks/recent',
  [
    authMiddleware
  ],
  getRecentTasks
);

router.post(
  '/projects/:projectId/tasks',
  [
    authMiddleware,
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title must not exceed 100 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('status').optional().isIn(['Backlog', 'To Do', 'In Progress', 'Review', 'Completed', 'Requirements', 'Design', 'Implementation', 'Deployment']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('assignee').optional().isMongoId().withMessage('Invalid assignee ID'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
    body('storyPoints').optional().isInt({ min: 0 }).withMessage('Story points must be a non-negative integer'),
    body('phase').optional().isString().withMessage('Phase must be a string'),
  ],
  validate,
  createTask
);

router.put(
  '/tasks/:taskId',
  [
    authMiddleware,
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }).withMessage('Title must not exceed 100 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('status').optional().isIn(['Backlog', 'To Do', 'In Progress', 'Review', 'Completed', 'Requirements', 'Design', 'Implementation', 'Deployment']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('assignee').optional().isMongoId().withMessage('Invalid assignee ID'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
    body('storyPoints').optional().isInt({ min: 0 }).withMessage('Story points must be a non-negative integer'),
    body('phase').optional().isString().withMessage('Phase must be a string'),
  ],
  validate,
  updateTask
);

router.delete(
  '/tasks/:taskId',
  [
    authMiddleware,
    roleMiddleware(['Administrator', 'Project Manager']),
    param('taskId').isMongoId().withMessage('Invalid task ID'),
  ],
  validate,
  deleteTask
);

router.post(
  '/tasks/:taskId/comments',
  [
    authMiddleware,
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    body('text').trim().notEmpty().withMessage('Comment text is required'),
  ],
  validate,
  addComment
);

router.post(
  '/tasks/:taskId/attachments',
  [
    authMiddleware,
    param('taskId').isMongoId().withMessage('Invalid task ID'),
  ],
  validate,
  upload.single('file'),
  addAttachment
);

module.exports = router;