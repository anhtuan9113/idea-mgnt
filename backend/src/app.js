const authRoutes = require('./routes/auth');
const ideaRoutes = require('./routes/ideas');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/notifications', notificationRoutes); 