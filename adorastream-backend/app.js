const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./db');
const { notFound, errorHandler } = require('./middleware/error');
const { audit } = require('./middleware/audit');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/user.routes');
const contentRoutes = require('./routes/content.routes');
const historyRoutes = require('./routes/watchHistory.routes');

const app = express();
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/streaming_app';
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(audit);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/history', historyRoutes);

app.use(notFound);
app.use(errorHandler);

(async () => {
  await connectDB();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
})();