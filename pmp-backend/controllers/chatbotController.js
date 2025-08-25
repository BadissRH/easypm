const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

dotenv.config();

// Initialize Gemini API with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Process a chatbot message as an assistant for the EasyPM project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user; // From authMiddleware

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Define system prompt to restrict responses to EasyPM
    const systemPrompt = `
      You are an assistant for EasyPM, a project management platform for Tunisian projects.
      Only respond to queries related to managing users, projects, tasks, and reports.
      Use Tunisian-themed data (e.g., projects like "Tunis Tourism Platform", names like Badiss Riahi).
      The user has the role "${user.role}" (Administrator, Project Manager, or Collaborator).
      Restrict responses based on role permissions:
      - Administrators can access all data.
      - Project Managers can access their projects and tasks.
      - Collaborators can only access their assigned tasks and projects.
      Do not respond to unrelated topics (e.g., general knowledge, external APIs).
      If a database query is needed, provide a concise summary of the data.
    `;

    // Query database based on message content
    let contextData = '';
    if (message.toLowerCase().includes('list projects')) {
      let projects;
      if (user.role === 'Administrator' || user.role === 'Project Manager') {
        projects = await Project.find().select('name description status progress');
      } else {
        projects = await Project.find({ team: user._id }).select('name description status progress');
      }
      contextData = `Projects: ${JSON.stringify(projects.map(p => ({ name: p.name, description: p.description, status: p.status, progress: p.progress })))}`;
    } else if (message.toLowerCase().includes('my tasks')) {
      const tasks = await Task.find({ assignee: user._id })
        .populate('project', 'name')
        .select('title status priority dueDate');
      contextData = `Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, project: t.project.name, status: t.status, priority: t.priority, dueDate: t.dueDate })))}`;
    } else if (message.toLowerCase().includes('project details') && message.match(/Tunis Tourism Platform|Sfax Olive Oil Export System/)) {
      const projectName = message.match(/Tunis Tourism Platform|Sfax Olive Oil Export System/)[0];
      const project = await Project.findOne({ name: projectName })
        .populate('team', 'name email role');
      if (project && (user.role === 'Administrator' || user.role === 'Project Manager' || project.team.some(member => member._id.toString() === user._id.toString()))) {
        contextData = `Project Details: ${JSON.stringify({
          name: project.name,
          description: project.description,
          status: project.status,
          progress: project.progress,
          team: project.team.map(t => ({ name: t.name, email: t.email, role: t.role })),
          startDate: project.startDate,
          deadline: project.deadline,
          methodology: project.methodology,
          budget: project.budget,
        })}`;
      } else {
        contextData = 'You do not have permission to view this project or it does not exist.';
      }
    }

    // Try multiple models for reliability
    const modelsToTry = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let responseText;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          apiVersion: 'v1beta',
        });

        const prompt = `${systemPrompt}\nUser Query: ${message}\nDatabase Context: ${contextData || 'No specific database data available.'}`;
        const result = await model.generateContent(prompt);
        responseText = await result.response.text();
        console.log(`Success with model: ${modelName}`);
        break;
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error.message);
      }
    }

    if (!responseText) {
      throw new Error('All attempted models failed. Check available models in Google AI Studio.');
    }

    return res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('Chatbot error:', error);
    if (error.message.includes('404') && error.message.includes('models/gemini')) {
      return res.status(400).json({
        error: 'Specified model not found. Check available models in Google AI Studio.',
        details: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to process message',
      details: error.message,
    });
  }
};