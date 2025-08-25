const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { getUsers, getAssignableUsers, inviteUser, updateUser, deleteUser } = require('../controllers/usersController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.get('/', authMiddleware, roleMiddleware(['Administrator']), getUsers);

router.get('/assignable', authMiddleware, roleMiddleware(['Administrator', 'Project Manager']), getAssignableUsers);

router.post(
  '/invite',
  [
    authMiddleware,
    roleMiddleware(['Administrator']),
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('role').optional().isIn(['Administrator', 'Project Manager', 'Collaborator']).withMessage('Invalid role'),
  ],
  validate,
  inviteUser
);

router.put(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['Administrator']),
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('role').optional().isIn(['Administrator', 'Project Manager', 'Collaborator']).withMessage('Invalid role'),
  ],
  validate,
  updateUser
);

router.delete(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['Administrator']),
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  deleteUser
);

module.exports = router;