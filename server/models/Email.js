const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  size: Number,
  content: Buffer, // Store file content as buffer
  contentId: String
});

const emailSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    name: String,
    address: {
      type: String,
      required: true
    }
  },
  to: [{
    name: String,
    address: String
  }],
  cc: [{
    name: String,
    address: String
  }],
  subject: {
    type: String,
    default: '(No Subject)'
  },
  body: {
    html: String,
    text: String
  },
  signature: String,
  attachments: [attachmentSchema],
  date: {
    type: Date,
    default: Date.now
  },
  isStarred: {
    type: Boolean,
    default: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  fetchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  jobId: {
    type: String,
    default: null,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
// messageId index is automatically created due to unique: true
emailSchema.index({ workspace: 1, isStarred: 1 });
emailSchema.index({ date: -1 });

module.exports = mongoose.model('Email', emailSchema);
