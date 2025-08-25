const Project = require('../models/Project');
const Task = require('../models/Task');

const getProjectReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('team', 'name email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.projectId });

    const taskBreakdown = {
      todo: tasks.filter(task => task.status === 'To Do').length,
      inProgress: tasks.filter(task => task.status === 'In Progress').length,
      completed: tasks.filter(task => task.status === 'Completed').length,
    };

    const teamStats = await Promise.all(project.team.map(async (member) => {
      const tasksCompleted = await Task.countDocuments({
        project: req.params.projectId,
        assignee: member._id,
        status: 'Completed',
      });
      return {
        name: member.name,
        email: member.email,
        tasksCompleted,
      };
    }));

    const report = {
      status: project.status,
      deadline: project.deadline,
      progress: project.progress,
      budget: {
        used: project.budget ? project.budget * 0.5 : 0,
        total: project.budget || 0,
      },
      tasks: taskBreakdown,
      team: teamStats,
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProjectReport };