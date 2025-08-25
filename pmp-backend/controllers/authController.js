const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthLog = require('../models/AuthLog');
const ResetToken = require('../models/ResetToken');
const { sendEmail } = require('../utils/email');
const { generateToken } = require('../utils/token');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      await AuthLog.create({
        event: 'Login Failure',
        email: email.toLowerCase(),
        ipAddress: req.ip,
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await AuthLog.create({
        event: 'Login Failure',
        email: email.toLowerCase(),
        ipAddress: req.ip,
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    await AuthLog.create({
      event: 'Login Success',
      user: user._id,
      email: user.email,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    user.password = newPassword;
    await user.save();

    await AuthLog.create({
      event: 'Password Reset',
      user: user._id,
      email: user.email,
      ipAddress: req.ip,
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 3600000);
    await ResetToken.create({
      user: user._id,
      token,
      type: 'password_reset',
      expires,
    });

    const resetLink = `http://localhost:5000/api/auth/reset-password?token=${token}&email=${email.toLowerCase()}`;
    await sendEmail(
      user.email,
      'EasyPM Password Reset',
      `Click this link to reset your password: ${resetLink}\nThis link expires in 1 hour.`
    );

    res.json({ message: 'Password reset code sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = await ResetToken.findOne({
      user: user._id,
      token: resetCode,
      type: 'password_reset',
      expires: { $gt: new Date() },
    });

    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    await user.save();

    await AuthLog.create({
      event: 'Password Reset',
      user: user._id,
      email: user.email,
      ipAddress: req.ip,
    });

    await ResetToken.deleteOne({ _id: token._id });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, changePassword, forgotPassword, resetPassword };