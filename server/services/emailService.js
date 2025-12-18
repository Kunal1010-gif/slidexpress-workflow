const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Email = require('../models/Email');

// IMAP configuration for Gmail
const createImapConnection = (email, password) => {
  return new Imap({
    user: email,
    password: password,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  });
};

// Fetch starred emails from Gmail
const fetchStarredEmails = (email, password, workspaceId, userId) => {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(email, password);
    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Search for starred emails (FLAGGED in IMAP)
        imap.search(['FLAGGED'], (err, results) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (results.length === 0) {
            imap.end();
            return resolve([]);
          }

          const fetch = imap.fetch(results, { bodies: '', markSeen: false });

          fetch.on('message', (msg, seqno) => {
            let emailData = {};

            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Error parsing email:', err);
                  return;
                }

                // Extract email details
                emailData = {
                  messageId: parsed.messageId,
                  from: {
                    name: parsed.from?.value?.[0]?.name || '',
                    address: parsed.from?.value?.[0]?.address || ''
                  },
                  to: parsed.to?.value?.map(addr => ({
                    name: addr.name || '',
                    address: addr.address || ''
                  })) || [],
                  cc: parsed.cc?.value?.map(addr => ({
                    name: addr.name || '',
                    address: addr.address || ''
                  })) || [],
                  subject: parsed.subject || '(No Subject)',
                  body: {
                    html: parsed.html || '',
                    text: parsed.text || ''
                  },
                  date: parsed.date || new Date(),
                  attachments: [],
                  workspace: workspaceId,
                  fetchedBy: userId,
                  isStarred: true
                };

                // Process attachments
                if (parsed.attachments && parsed.attachments.length > 0) {
                  emailData.attachments = parsed.attachments.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: att.size,
                    content: att.content,
                    contentId: att.contentId
                  }));
                }

                emails.push(emailData);
              });
            });

            msg.once('end', () => {
              console.log(`Processed email ${seqno}`);
            });
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log('Done fetching emails');
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('IMAP connection ended');
      // Wait a bit for all emails to be processed
      setTimeout(() => {
        resolve(emails);
      }, 1000);
    });

    imap.connect();
  });
};

// Save emails to database
const saveEmailsToDatabase = async (emails) => {
  const savedEmails = [];

  for (const emailData of emails) {
    try {
      // Check if email already exists
      const existingEmail = await Email.findOne({ messageId: emailData.messageId });

      if (!existingEmail) {
        const newEmail = await Email.create(emailData);
        savedEmails.push(newEmail);
      } else {
        savedEmails.push(existingEmail);
      }
    } catch (error) {
      console.error('Error saving email:', error);
    }
  }

  return savedEmails;
};

// Get starred emails from database
const getStoredEmails = async (workspaceId) => {
  try {
    const emails = await Email.find({
      workspace: workspaceId,
      isStarred: true
    })
      .sort({ date: -1 })
      .select('-attachments.content') // Don't send attachment content in list view
      .lean();

    return emails;
  } catch (error) {
    console.error('Error fetching stored emails:', error);
    throw error;
  }
};

// Get single email with attachments
const getEmailById = async (emailId) => {
  try {
    const email = await Email.findById(emailId).lean();
    return email;
  } catch (error) {
    console.error('Error fetching email:', error);
    throw error;
  }
};

// Delete email
const deleteEmail = async (emailId) => {
  try {
    await Email.findByIdAndDelete(emailId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
};

module.exports = {
  fetchStarredEmails,
  saveEmailsToDatabase,
  getStoredEmails,
  getEmailById,
  deleteEmail
};
