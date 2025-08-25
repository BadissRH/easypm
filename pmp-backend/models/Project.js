const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  status: {
    type: String,
    enum: ['Active', 'On Hold', 'Completed', 'Archived'],
    default: 'Active'
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startDate: { type: Date, required: true },
  deadline: { type: Date },
  methodology: {
    type: String,
    enum: ['None', 'Agile (Scrum)', 'Kanban', 'Waterfall', 'Lean'],
    default: 'None'
  },
  budget: { type: Number },
  sprintDuration: { type: Number }, // Agile
  wipLimit: { type: Number }, // Kanban
  phases: [{ name: String, milestoneDate: Date }], // Waterfall
  valueGoals: { type: String }, // Lean
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);