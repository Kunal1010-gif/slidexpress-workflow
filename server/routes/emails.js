const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  fetchStarredEmails,
  saveEmailsToDatabase,
  getStoredEmails,
  getEmailById,
  deleteEmail
} = require('../services/emailService');

// Fetch and sync starred emails from Gmail (Workflow Coordinator only)
router.post('/sync', authenticate, authorize('workflow_coordinator', 'it_admin', 'super_admin'), async (req, res) => {
  try {
    if (!req.user.workspace) {
      return res.status(400).json({ message: 'User must be assigned to a workspace' });
    }

    // Use email credentials from environment variables
    const email = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;

    if (!email || !password) {
      return res.status(500).json({ message: 'Email credentials not configured' });
    }

    // Fetch starred emails from Gmail using IMAP
    const emails = await fetchStarredEmails(email, password, req.user.workspace._id, req.user._id);

    // Save to database
    const savedEmails = await saveEmailsToDatabase(emails);

    res.json({
      message: 'Emails synced successfully',
      count: savedEmails.length,
      emails: savedEmails.map(e => ({
        _id: e._id,
        from: e.from,
        subject: e.subject,
        date: e.date
      }))
    });
  } catch (error) {
    console.error('Email sync error:', error);
    res.status(500).json({
      message: 'Failed to sync emails',
      error: error.message
    });
  }
});

// Get all stored starred emails for workspace
router.get('/', authenticate, authorize('workflow_coordinator', 'it_admin', 'super_admin'), async (req, res) => {
  try {
    if (!req.user.workspace) {
      return res.status(400).json({ message: 'User must be assigned to a workspace' });
    }

    const emails = await getStoredEmails(req.user.workspace._id);

    res.json({ emails });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({
      message: 'Failed to fetch emails',
      error: error.message
    });
  }
});

// Get single email with full details including attachments
router.get('/:id', authenticate, authorize('workflow_coordinator', 'it_admin', 'super_admin'), async (req, res) => {
  try {
    const email = await getEmailById(req.params.id);

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    res.json({ email });
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({
      message: 'Failed to fetch email',
      error: error.message
    });
  }
});

// Download attachment
router.get('/:emailId/attachments/:attachmentId', authenticate, authorize('workflow_coordinator', 'it_admin', 'super_admin'), async (req, res) => {
  try {
    const email = await getEmailById(req.params.emailId);

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const attachment = email.attachments[parseInt(req.params.attachmentId)];

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Convert the content to a proper Buffer if it's not already
    const buffer = Buffer.isBuffer(attachment.content)
      ? attachment.content
      : Buffer.from(attachment.content.buffer || attachment.content);

    res.setHeader('Content-Type', attachment.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      message: 'Failed to download attachment',
      error: error.message
    });
  }
});

// Delete email
router.delete('/:id', authenticate, authorize('workflow_coordinator', 'it_admin', 'super_admin'), async (req, res) => {
  try {
    await deleteEmail(req.params.id);
    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      message: 'Failed to delete email',
      error: error.message
    });
  }
});

module.exports = router;
