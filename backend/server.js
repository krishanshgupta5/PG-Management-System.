const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to index.html for Single Page App routing
app.get('*any', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pg_management';

const { startCronJobs } = require('./utils/cronJobs');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log('MongoDB connection error:', err));
