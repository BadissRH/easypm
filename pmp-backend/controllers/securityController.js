const AuthLog = require('../models/AuthLog');

const getLogs = async (req, res) => {
  try {
    const logs = await AuthLog.find()
      .populate('user', 'name email')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getLogs };