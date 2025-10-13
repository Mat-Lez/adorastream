require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./db');
const { ensureAdminFromEnv } = require('./utils/adminSeed');
const { notFound, errorHandler } = require('./middleware/error');
const { audit } = require('./middleware/audit');
const { requireLogin, requireAdmin } = require('./middleware/auth');
const path = require('path');
const pagesRouter = require('./routes/pages.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/user.routes');
const contentRoutes = require('./routes/content.routes');
const historyRoutes = require('./routes/watchHistory.routes');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/streaming_app';
const app = express();

app.use(express.json());


app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(audit);

// Guarded pages (must be authenticated) - after session middleware
app.get('/profile-selection.html', requireLogin, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'profile-selection.html'));
});
app.get('/add-profile.html', requireLogin, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'add-profile.html'));
});

// Admin-only page
app.get('/add-content.html', requireLogin, requireAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'add-content.html'));
});

// Static files (after guarded routes to avoid public access bypass)
app.use(express.static('public'));
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use('/', pagesRouter);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/history', historyRoutes);

app.use(notFound);
app.use(errorHandler);

(async () => {
  await connectDB();
  try { await ensureAdminFromEnv(); } catch (e) { console.warn('Admin seed skipped:', e.message); }
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
})();