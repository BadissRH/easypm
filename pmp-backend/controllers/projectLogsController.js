const ProjectLog = require('../models/ProjectLog');
const Project = require('../models/Project');

// Get all logs for a specific project
const getProjectLogs = async (req, res) => {
  try {
    const logs = await ProjectLog.find({ project: req.params.projectId })
      .populate('user', 'name email')
      .populate('project', 'name')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all project logs (for administrators)
const getAllProjectLogs = async (req, res) => {
  try {
    const logs = await ProjectLog.find()
      .populate('user', 'name email')
      .populate('project', 'name')
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a project log entry
const createProjectLog = async (projectId, userId, action, details) => {
  try {
    const log = new ProjectLog({
      project: projectId,
      user: userId,
      action,
      details
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating project log:', error);
    return null;
  }
};

module.exports = { getProjectLogs, getAllProjectLogs, createProjectLog };