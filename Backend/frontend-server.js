const express = require('express');
const path = require('path');
require('dotenv').config();
const pool = require('./config/database');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));
app.use('/api/emails', require('./routes/emailRoutes'));
app.use('/api/email-accounts', require('./routes/emailAccountRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date() });
});

// Serve static files from Frontend folder
app.use(express.static(path.join(__dirname, '../Frontend')));

// Route for index.html (login page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// Route for home page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/priorInboX-home.html'));
});

// Route for emails page
app.get('/emails', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/emails.html'));
});

// Route for settings page
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/account-settings.html'));
});

// 404 handler
app.use((req, res) => {
  if (req.accepts('json')) {
    res.status(404).json({ message: 'Route not found' });
  } else {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 PriorInBox Server Running       ║
╠════════════════════════════════════════╣
║ Frontend:  http://localhost:${PORT}         ║
║ API:       http://localhost:${PORT}/api     ║
║ Health:    http://localhost:${PORT}/api/health ║
║                                        ║
║ Login at: http://localhost:${PORT}/      ║
║ Demo: demo@priorinbox.com / Demo@123  ║
╚════════════════════════════════════════╝
  `);
});
