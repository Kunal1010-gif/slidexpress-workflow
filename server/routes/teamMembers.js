const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const Ticket = require('../models/Ticket');
const { authenticate } = require('../middleware/auth');

// Get all team members
router.get('/', async (req, res) => {
  try {
    const teamMembers = await TeamMember.find()
      .sort({ tlName: 1, name: 1 });
    res.json({ teamMembers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get team members grouped by team lead
router.get('/grouped', async (req, res) => {
  try {
    const teamMembers = await TeamMember.find()
      .sort({ tlName: 1, name: 1 });

    // Group by team lead name
    const grouped = {};
    teamMembers.forEach(member => {
      if (!grouped[member.tlName]) {
        grouped[member.tlName] = [];
      }
      grouped[member.tlName].push(member.name);
    });

    res.json({ teamMap: grouped, teamMembers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new team member
router.post('/', async (req, res) => {
  try {
    const teamMember = new TeamMember(req.body);
    await teamMember.save();
    res.json({ message: "Team member created", teamMember });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update team member
router.put('/:id', async (req, res) => {
  try {
    const teamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: "Team member updated", teamMember });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete team member (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await TeamMember.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Team member deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get tasks for the currently logged-in user
router.get('/my-tasks/current', authenticate, async (req, res) => {
  try {
    const user = req.user; // From auth middleware

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Fetching tasks for authenticated user:', user.name, user.email);

    // Try to match by name first, then by email
    let tickets = await Ticket.find({
      'assignedInfo.empName': user.name
    }).sort({ createdAt: -1 });

    console.log('Tickets found by name:', tickets.length);

    // If no tickets found by name, try matching by email
    if (tickets.length === 0 && user.email) {
      // Find TeamMember by email
      const teamMember = await TeamMember.findOne({ emailId: user.email });

      if (teamMember) {
        console.log('Found team member by email:', teamMember.name);
        tickets = await Ticket.find({
          'assignedInfo.empName': teamMember.name
        }).sort({ createdAt: -1 });
        console.log('Tickets found by team member name:', tickets.length);
      }
    }

    res.json({
      user: user.name,
      taskCount: tickets.length,
      tasks: tickets
    });
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get tasks/tickets assigned to a specific team member by name
router.get('/:memberName/tasks', async (req, res) => {
  try {
    const { memberName } = req.params;

    // Find all tickets assigned to this team member
    const tickets = await Ticket.find({
      'assignedInfo.empName': memberName
    }).sort({ createdAt: -1 });

    res.json({
      teamMember: memberName,
      taskCount: tickets.length,
      tasks: tickets
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
