const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  emailId: {
    type: String,
    default: null
  },
  teamName: {
    type: String,
    required: true
  },
  tlName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
teamMemberSchema.index({ name: 1 });
teamMemberSchema.index({ tlName: 1 });
teamMemberSchema.index({ teamName: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema, 'teammembers');
