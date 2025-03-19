const express = require('express');
const cors = require('cors');
const path = require('path');
const ideasRouter = require('./routes/ideas');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/ideas', ideasRouter);
app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 