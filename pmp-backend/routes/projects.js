const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const { getProjects, createProject, getProject, updateProject, deleteProject } = require('../controllers/projectsController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/', authMiddleware, getProjects);

router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware(['Administrator', 'Project Manager']),
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('status').optional().isIn(['Active', 'On Hold', 'Completed', 'Archived']).withMessage('Invalid status'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
    body('team').optional().isArray().withMessage('Team must be an array').custom((value) => {
      return value.every(id => mongoose.Types.ObjectId.isValid(id));
    }).withMessage('Invalid user IDs in team'),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline'),
    body('methodology').optional().isIn(['None', 'Agile (Scrum)', 'Kanban', 'Waterfall', 'Lean']).withMessage('Invalid methodology'),
    body('budget').optional().isNumeric().withMessage('Budget must be a number'),
    body('sprintDuration').optional().isInt({ min: 1 }).withMessage('Sprint duration must be a positive integer'),
    body('wipLimit').optional().isInt({ min: 1 }).withMessage('WIP limit must be a positive integer'),
    body('phases').optional().isArray().withMessage('Phases must be an array'),
    body('phases.*.name').optional().notEmpty().withMessage('Phase name is required'),
    body('phases.*.milestoneDate').optional().isISO8601().withMessage('Invalid milestone date'),
    body('valueGoals').optional().isString().withMessage('Value goals must be a string'),
  ],
  validate,
  createProject
);

router.get(
  '/:id',
  [
    authMiddleware,
    param('id').isMongoId().withMessage('Invalid project ID'),
  ],
  validate,
  getProject
);

router.put(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['Administrator', 'Project Manager']),
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('status').optional().isIn(['Active', 'On Hold', 'Completed', 'Archived']).withMessage('Invalid status'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
    body('team').optional().isArray().withMessage('Team must be an array').custom((value) => {
      return value.every(id => mongoose.Types.ObjectId.isValid(id));
    }).withMessage('Invalid user IDs in team'),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline'),
    body('methodology').optional().isIn(['None', 'Agile (Scrum)', 'Kanban', 'Waterfall', 'Lean']).withMessage('Invalid methodology'),
    body('budget').optional().isNumeric().withMessage('Budget must be a number'),
    body('sprintDuration').optional().isInt({ min: 1 }).withMessage('Sprint duration must be a positive integer'),
    body('wipLimit').optional().isInt({ min: 1 }).withMessage('WIP limit must be a positive integer'),
    body('phases').optional().isArray().withMessage('Phases must be an array'),
    body('phases.*.name').optional().notEmpty().withMessage('Phase name is required'),
    body('phases.*.milestoneDate').optional().isISO8601().withMessage('Invalid milestone date'),
    body('valueGoals').optional().isString().withMessage('Value goals must be a string'),
  ],
  validate,
  updateProject
);

router.delete(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['Administrator']),
    param('id').isMongoId().withMessage('Invalid project ID'),
  ],
  validate,
  deleteProject
);

module.exports = router;