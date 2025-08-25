const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const getStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const tasksCompleted = await Task.countDocuments({ status: 'Completed' });
    const overdueTasks = await Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'Completed' } });
    const activeTeamMembers = await User.countDocuments({ role: { $in: ['Collaborator', 'Project Manager'] } });

    res.json({
      totalProjects,
      tasksCompleted,
      overdueTasks,
      activeTeamMembers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserTasks = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && !['Administrator', 'Project Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ assignee: req.params.userId })
      .populate('project', 'name')
      .populate('assignee', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserProjects = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && !['Administrator', 'Project Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const projects = await Project.find({ team: req.params.userId })
      .populate('team', 'name email role');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserNotifications = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && !['Administrator', 'Project Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const recentTasks = await Task.find({ assignee: req.params.userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('project', 'name');

    const notifications = recentTasks.map(task => ({
      id: task._id,
      text: `Task "${task.title}" in project "${task.project.name}" was updated`,
      time: task.updatedAt,
    }));

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getUserTasks, getUserProjects, getUserNotifications };