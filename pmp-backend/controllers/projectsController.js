const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const { createProjectLog } = require('./projectLogsController');

const getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Administrator' || req.user.role === 'Project Manager') {
      projects = await Project.find().populate('team', 'name email role');
    } else {
      projects = await Project.find({ team: req.user._id }).populate('team', 'name email role');
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createProject = async (req, res) => {
  const {
    name, description, status, progress, team, startDate, deadline,
    methodology, budget, sprintDuration, wipLimit, phases, valueGoals
  } = req.body;

  try {
    const project = new Project({
      name,
      description,
      status,
      progress,
      team: team || [],
      startDate,
      deadline,
      methodology,
      budget,
      sprintDuration,
      wipLimit,
      phases,
      valueGoals,
      createdBy: req.user._id,
    });
    await project.save();

    if (team && team.length > 0) {
      await User.updateMany(
        { _id: { $in: team } },
        { $addToSet: { assignedProjects: project._id } }
      );
    }
    
    // Log project creation
    await createProjectLog(
      project._id,
      req.user._id,
      'Created',
      { name: project.name, description: project.description }
    );

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('team', 'name email role');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAdminOrPM = req.user.role === 'Administrator' || req.user.role === 'Project Manager';
    const isTeamMember = project.team.some(member => member._id.toString() === req.user._id.toString());
    if (!isAdminOrPM && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  const updates = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Track changes for logging
    const changes = {};
    const logDetails = {};
    
    // Determine what's being updated for logging
    if (updates.name && updates.name !== project.name) {
      changes.name = { from: project.name, to: updates.name };
      logDetails.name = updates.name;
    }
    
    if (updates.description && updates.description !== project.description) {
      changes.description = { from: project.description, to: updates.description };
      logDetails.description = updates.description;
    }
    
    if (updates.status && updates.status !== project.status) {
      changes.status = { from: project.status, to: updates.status };
      await createProjectLog(
        project._id,
        req.user._id,
        'Status Changed',
        { from: project.status, to: updates.status }
      );
    }
    
    if (updates.progress && updates.progress !== project.progress) {
      changes.progress = { from: project.progress, to: updates.progress };
      await createProjectLog(
        project._id,
        req.user._id,
        'Progress Updated',
        { from: project.progress, to: updates.progress }
      );
    }
    
    // Apply all updates
    Object.assign(project, updates);
    project.lastUpdate = Date.now();
    await project.save();

    // Handle team changes
    if (updates.team) {
      // Get current team members before update
      const currentTeam = project.team.map(id => id.toString());
      const newTeam = updates.team.map(id => id.toString());
      
      // Find added and removed team members
      const addedMembers = newTeam.filter(id => !currentTeam.includes(id));
      const removedMembers = currentTeam.filter(id => !newTeam.includes(id));
      
      if (addedMembers.length > 0 || removedMembers.length > 0) {
        await createProjectLog(
          project._id,
          req.user._id,
          'Team Changed',
          { added: addedMembers, removed: removedMembers }
        );
      }
      
      // Update user associations
      await User.updateMany(
        { assignedProjects: project._id, _id: { $nin: updates.team } },
        { $pull: { assignedProjects: project._id } }
      );
      await User.updateMany(
        { _id: { $in: updates.team } },
        { $addToSet: { assignedProjects: project._id } }
      );
    }
    
    // Log general update if there were changes not already logged
    if (Object.keys(changes).length > 0) {
      await createProjectLog(
        project._id,
        req.user._id,
        'Updated',
        { changes }
      );
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Log project deletion before deleting
    await createProjectLog(
      project._id,
      req.user._id,
      'Deleted',
      { name: project.name, id: project._id }
    );

    await User.updateMany(
      { assignedProjects: project._id },
      { $pull: { assignedProjects: project._id } }
    );

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };