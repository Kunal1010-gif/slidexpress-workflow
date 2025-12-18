const mongoose = require('mongoose');
const TeamMember = require('./models/TeamMember');
require('dotenv').config();

// Sample team members data (matching the original hardcoded TEAM_MAP)
const sampleTeamMembers = [
  { name: 'Rahul', teamLead: 'TL A', email: 'rahul@example.com' },
  { name: 'Sneha', teamLead: 'TL A', email: 'sneha@example.com' },
  { name: 'Amit', teamLead: 'TL B', email: 'amit@example.com' },
  { name: 'Pooja', teamLead: 'TL B', email: 'pooja@example.com' },
  { name: 'Karan', teamLead: 'TL C', email: 'karan@example.com' }
];

async function seedTeamMembers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing team members (optional)
    await TeamMember.deleteMany({});
    console.log('Cleared existing team members');

    // Insert sample team members
    const inserted = await TeamMember.insertMany(sampleTeamMembers);
    console.log(`Inserted ${inserted.length} team members:`);
    inserted.forEach(member => {
      console.log(`  - ${member.name} (${member.teamLead})`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding team members:', error);
    process.exit(1);
  }
}

seedTeamMembers();
