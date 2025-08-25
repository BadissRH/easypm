const mongoose = require('mongoose');

const projectLogSchema = new mongoose.Schema({
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  action: {
    type: String,
    enum: [
      "Created", "Updated", "Deleted", "Status Changed", "Team Changed", "Progress Updated",
      "Task Created", "Task Updated", "Task Status Changed", "Task Reassigned", "Task Deleted", "Comment Added"
    ],
    required: true
  },
  details: { 
    type: Object 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ProjectLog', projectLogSchema);