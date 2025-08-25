const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['password_reset', 'invite'],
    required: true
  },
  expires: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('ResetToken', resetTokenSchema);