require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('Existing data cleared.');

    const password = 'pfe123&';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
      {
        name: 'Badiss Riahi',
        email: 'badissrh@gmail.com',
        password: hashedPassword,
        role: 'Administrator',
        assignedProjects: []
      },
      {
        name: 'Adam Chebbi',
        email: 'adam.chebbi.55@gmail.com',
        password: hashedPassword,
        role: 'Project Manager',
        assignedProjects: []
      },
      {
        name: 'Ghada Ben Sassi',
        email: 'gbensassi3@gmail.com',
        password: hashedPassword,
        role: 'Collaborator',
        assignedProjects: []
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Users seeded:', createdUsers.map(u => u.email));

    const projects = [
      {
        name: 'Tunis Tourism Platform',
        description: 'A digital platform to promote tourism in Tunis, showcasing historical sites like Carthage and the Medina.',
        status: 'Active',
        progress: 40,
        team: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[2]._id],
        startDate: new Date('2025-07-01'),
        deadline: new Date('2025-12-31'),
        methodology: 'Agile (Scrum)',
        budget: 50000,
        sprintDuration: 2,
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Sfax Olive Oil Export System',
        description: 'A system to manage olive oil exports from Sfax, integrating with local cooperatives.',
        status: 'On Hold',
        progress: 10,
        team: [createdUsers[1]._id, createdUsers[2]._id],
        startDate: new Date('2025-08-01'),
        deadline: new Date('2026-03-31'),
        methodology: 'Waterfall',
        budget: 30000,
        createdBy: createdUsers[1]._id
      }
    ];

    const createdProjects = await Project.insertMany(projects);
    console.log('Projects seeded:', createdProjects.map(p => p.name));

    await User.updateOne(
      { _id: createdUsers[0]._id },
      { $set: { assignedProjects: [createdProjects[0]._id] } }
    );
    await User.updateOne(
      { _id: createdUsers[1]._id },
      { $set: { assignedProjects: [createdProjects[0]._id, createdProjects[1]._id] } }
    );
    await User.updateOne(
      { _id: createdUsers[2]._id },
      { $set: { assignedProjects: [createdProjects[0]._id, createdProjects[1]._id] } }
    );
    console.log('User projects updated.');

    const tasks = [
      {
        title: 'Design Carthage Tour Page',
        description: 'Create a responsive webpage for the Carthage historical tour.',
        project: createdProjects[0]._id,
        status: 'To Do',
        priority: 'High',
        assignee: createdUsers[2]._id,
        dueDate: new Date('2025-09-15'),
        storyPoints: 5
      },
      {
        title: 'API for Medina Listings',
        description: 'Develop REST API for listing shops in the Medina of Tunis.',
        project: createdProjects[0]._id,
        status: 'In Progress',
        priority: 'Medium',
        assignee: createdUsers[1]._id,
        dueDate: new Date('2025-10-01'),
        storyPoints: 8
      },
      {
        title: 'Sfax Cooperative Database',
        description: 'Set up MongoDB schema for olive oil cooperative data.',
        project: createdProjects[1]._id,
        status: 'Backlog',
        priority: 'Low',
        assignee: createdUsers[2]._id,
        dueDate: new Date('2025-11-01'),
        storyPoints: 3
      }
    ];

    const createdTasks = await Task.insertMany(tasks);
    console.log('Tasks seeded:', createdTasks.map(t => t.title));

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();