require('dotenv').config({ silent: true });
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors'); // Add cors import

const app = express();

// Enable CORS for the frontend origin
app.use(cors({
  origin: 'http://localhost:9002', // Allow requests from your frontend
  credentials: true, // Allow cookies or auth headers if needed
}));

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/security', require('./routes/security'));
app.use('/api', require('./routes/projectLogs'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));