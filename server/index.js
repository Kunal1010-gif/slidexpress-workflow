// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/tickets', require('./routes/tickets'));


// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI) // no useNewUrlParser / useUnifiedTopology
  .then(() => console.log('🚀 MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/tickets', require('./routes/tickets')); // Tickets API
app.use('/api/team-members', require('./routes/teamMembers')); // Team Members API

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Slidexpress Workflow API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
