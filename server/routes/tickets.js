const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Email = require('../models/Email');

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new ticket
router.post('/', async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();

    // If this ticket was created from an email, link the email to this jobId
    if (req.body.sourceEmailId && req.body.jobId) {
      await Email.findByIdAndUpdate(
        req.body.sourceEmailId,
        { jobId: req.body.jobId },
        { new: true }
      );
    }

    res.json({ message: "Ticket created", ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update ticket (status / assignment)
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If status is changing to 'in_process', set startedAt timestamp
    if (req.body.status === 'in_process') {
      const existingTicket = await Ticket.findById(req.params.id);
      if (existingTicket && existingTicket.status !== 'in_process' && !existingTicket.startedAt) {
        updateData.startedAt = new Date();
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email');
    res.json({ message: "Ticket updated", ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign ticket to team member with team lead
router.post('/:id/assign', async (req, res) => {
  try {
    const updateData = {
      assignedInfo: req.body.assignedInfo,
      status: req.body.status
    };

    // Set assignedAt timestamp when assigning to a team member
    if (req.body.assignedInfo?.empName) {
      const existingTicket = await Ticket.findById(req.params.id);
      if (existingTicket && !existingTicket.assignedAt) {
        updateData.assignedAt = new Date();
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email');
    res.json({ message: "Ticket assigned", ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete ticket
router.delete('/:id', async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: "Ticket deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get emails by Job ID
router.get('/emails/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Find all emails associated with this jobId
    const emails = await Email.find({ jobId }).sort({ date: -1 });

    // Format emails for the frontend
    const formattedEmails = emails.map(email => {
      let processedHtml = email.body?.html || null;

      // Convert Content-ID (cid:) image references to base64 data URIs
      if (processedHtml && email.attachments && email.attachments.length > 0) {
        email.attachments.forEach((att) => {
          if (att.contentId && att.contentType && att.contentType.startsWith('image/')) {
            // Remove < and > from contentId if present
            const cid = att.contentId.replace(/^<|>$/g, '');

            // Convert buffer to base64
            const base64 = att.content ? Buffer.from(att.content).toString('base64') : '';
            const dataUri = `data:${att.contentType};base64,${base64}`;

            // Replace all occurrences of cid: references with data URI
            const cidPattern = new RegExp(`cid:${cid}`, 'gi');
            processedHtml = processedHtml.replace(cidPattern, dataUri);
          }
        });
      }

      return {
        _id: email._id,
        from: email.from?.address || email.from?.name || 'Unknown',
        to: email.to?.map(t => t.address || t.name).join(', ') || 'Unknown',
        subject: email.subject || 'No Subject',
        body: email.body?.text || 'No content',
        bodyHtml: processedHtml,
        date: email.date,
        attachments: email.attachments?.filter(att =>
          // Filter out inline images (those with contentId)
          !att.contentId
        ).map((att, idx) => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          index: idx
        })) || []
      };
    });

    res.json({ emails: formattedEmails });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
