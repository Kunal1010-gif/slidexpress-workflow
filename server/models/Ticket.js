const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  consultantName: { type: String, required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: false },
  status: { type: String, default: "not_assigned" }, // new, assigned, qc, done
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedInfo: {
    empName: { type: String, default: null },
    teamLead: { type: String, default: null }
  },
  meta: {
    toCheck: { type: String, default: null },
    clientType: { type: String, default: null },
    teamEst: { type: String, default: null },
    deadline: { type: String, default: null },
    timezone: { type: String, default: null },
    comments: { type: String, default: null }
  },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  assignedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  attachments: { type: Array, default: [] },
  sourceEmailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Email', default: null }
});

module.exports = mongoose.model("Ticket", ticketSchema);
