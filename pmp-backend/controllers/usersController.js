const User = require('../models/User');
const ResetToken = require('../models/ResetToken');
const { sendEmail } = require('../utils/email');
const { generateToken } = require('../utils/token');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAssignableUsers = async (req, res) => {
  try {
    const assignableUsers = await User.find({
      role: { $in: ['Collaborator', 'Project Manager'] },
    }).select('-password');
    res.json(assignableUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const inviteUser = async (req, res) => {
  const { name, email, role } = req.body;

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const tempPassword = generateToken();
    user = new User({
      name,
      email: email.toLowerCase(),
      password: tempPassword,
      role: role || 'Collaborator',
    });
    await user.save();

    const inviteToken = generateToken();
    const expires = new Date(Date.now() + 24 * 3600000);
    await ResetToken.create({
      user: user._id,
      token: inviteToken,
      type: 'invite',
      expires,
    });

    const inviteLink = `http://localhost:5000/api/auth/reset-password?token=${inviteToken}&email=${email.toLowerCase()}`;
    await sendEmail(
      email,
      'EasyPM Invitation',
      `You have been invited to join EasyPM as a ${role || 'Collaborator'}. Click this link to set your password: ${inviteLink}\nThis link expires in 24 hours.`
    );

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { name, role } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers, getAssignableUsers, inviteUser, updateUser, deleteUser };