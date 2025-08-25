const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post(
  '/change-password',
  [
    authMiddleware,
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
      .notEmpty().withMessage('New password is required'),
  ],
  validate,
  changePassword
);

router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Invalid email format'),
  ],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('resetCode').notEmpty().withMessage('Reset code is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
      .notEmpty().withMessage('New password is required'),
  ],
  validate,
  resetPassword
);

module.exports = router;