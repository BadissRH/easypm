const mongoose = require('mongoose');

const authLogSchema = new mongoose.Schema({
  event: {
    type: String,
    enum: ["Login Success", "Login Failure", "Logout", "Password Reset"],
    required: true
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuthLog', authLogSchema);