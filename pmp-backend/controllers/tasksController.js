const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { createProjectLog } = require('./projectLogsController');

const getRecentTasks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Find tasks assigned to the user or from projects they're part of
    const tasks = await Task.find({
      $or: [
        { assignee: req.user._id },
        { project: { $in: await Project.find({ team: req.user._id }).select('_id') } }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('project', 'name')
    .populate('assignee', 'name email');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAdminOrPM = req.user.role === 'Administrator' || req.user.role === 'Project Manager';
    const isTeamMember = project.team.some(member => member.toString() === req.user._id.toString());
    if (!isAdminOrPM && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let tasks;
    if (isAdminOrPM || isTeamMember) {
      tasks = await Task.find({ project: req.params.projectId })
        .populate('assignee', 'name email')
        .populate('comments.author', 'name');
    } else {
      tasks = await Task.find({ project: req.params.projectId, assignee: req.user._id })
        .populate('assignee', 'name email')
        .populate('comments.author', 'name');
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createTask = async (req, res) => {
  const { title, description, status, priority, assignee, dueDate, storyPoints, phase } = req.body;

  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAdminOrPM = req.user.role === 'Administrator' || req.user.role === 'Project Manager';
    const isTeamMember = project.team.some(member => member.toString() === req.user._id.toString());
    if (!isAdminOrPM && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = new Task({
      title,
      description,
      project: req.params.projectId,
      status,
      priority,
      assignee,
      dueDate,
      storyPoints,
      phase,
    });
    await task.save();
    
    // Log task creation
    await createProjectLog(
      req.params.projectId,
      req.user._id,
      'Task Created',
      { taskId: task._id, title: task.title, assignee: task.assignee }
    );
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  const updates = req.body;

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isAdminOrPM = req.user.role === 'Administrator' || req.user.role === 'Project Manager';
    const isAssigned = task.assignee && task.assignee.toString() === req.user._id.toString();
    if (!isAdminOrPM && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Track changes for logging
    const changes = {};
    
    // Check for status change
    if (updates.status && updates.status !== task.status) {
      changes.status = { from: task.status, to: updates.status };
      await createProjectLog(
        task.project,
        req.user._id,
        'Task Status Changed',
        { taskId: task._id, title: task.title, from: task.status, to: updates.status }
      );
    }
    
    // Check for assignee change
    if (updates.assignee && (!task.assignee || updates.assignee.toString() !== task.assignee.toString())) {
      changes.assignee = { from: task.assignee, to: updates.assignee };
      await createProjectLog(
        task.project,
        req.user._id,
        'Task Reassigned',
        { taskId: task._id, title: task.title, to: updates.assignee }
      );
    }

    Object.assign(task, updates);
    task.updatedAt = Date.now();
    await task.save();
    
    // Log general update if there were other changes
    if (Object.keys(changes).length > 0) {
      await createProjectLog(
        task.project,
        req.user._id,
        'Task Updated',
        { taskId: task._id, title: task.title, changes }
      );
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Log task deletion before deleting
    await createProjectLog(
      task.project,
      req.user._id,
      'Task Deleted',
      { taskId: task._id, title: task.title }
    );
    
    await Task.findByIdAndDelete(req.params.taskId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addComment = async (req, res) => {
  const { text } = req.body;

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isAdminOrPM = req.user.role === 'Administrator' || req.user.role === 'Project Manager';
    const isTeamMember = project.team.some(member => member.toString() === req.user._id.toString());
    if (!isAdminOrPM && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.comments.push({ author: req.user._id, text });
    await task.save();
    
    // Log comment addition
    await createProjectLog(
      task.project,
      req.user._id,
      'Comment Added',
      { taskId: task._id, title: task.title }
    );
    
    const updatedTask = await Task.findById(req.params.taskId).populate('comments.author', 'name');
    res.status(201).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isAdminOrPM = req.user.role === 'Administrator' || req.user.role === 'Project Manager';
    const isTeamMember = project.team.some(member => member.toString() === req.user._id.toString());
    if (!isAdminOrPM && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    task.attachments.push({
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype,
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  getRecentTasks,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  addAttachment
};