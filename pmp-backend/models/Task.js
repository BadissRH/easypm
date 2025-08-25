const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 1000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: {
    type: String,
    enum: ["Backlog", "To Do", "In Progress", "Review", "Completed", "Requirements", "Design", "Implementation", "Deployment"],
    default: 'Backlog'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  storyPoints: { type: Number }, // Agile
  phase: { type: String }, // Waterfall
  attachments: [attachmentSchema],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);