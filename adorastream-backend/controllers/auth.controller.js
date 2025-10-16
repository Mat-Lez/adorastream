const bcrypt = require('bcrypt');
const User = require('../models/user');

function norm(v = '') { return String(v).trim().toLowerCase(); }

exports.register = async (req, res) => {
  try {
    const username = norm(req.body.username);
    const password = String(req.body.password || '');

    if (!username || !password) {
      const e = new Error('username and password are required'); e.status = 400; throw e;
    }

    const exists = await User.findOne({ username }).lean();
    if (exists) {
      const e = new Error('Username already registered'); e.status = 400; throw e;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, roles: ['user'] });

    await new Promise((resolve, reject) => {
      req.session.regenerate(err => {
        if (err) return reject(err);
        req.session.user = { id: user.id, roles: user.roles };
        req.session.save(saveErr => (saveErr ? reject(saveErr) : resolve()));
      });
    });

    res.status(201).json({ user: req.session.user });
  } catch (err) {
    // Safety net if two users try to register with the same email at the same time
    if (err && err.code === 11000) {
      err = new Error('Username already registered'); err.status = 400;
    }
    throw err;
  }
};

exports.login = async (req, res) => {
  const username = norm(req.body.username);
  const password = String(req.body.password || '');

  if (!username || !password) {
    const e = new Error('username and password are required'); e.status = 400; throw e;
  }

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const e = new Error('Invalid credentials'); e.status = 401; throw e;
  }

  await new Promise((resolve, reject) => {
    req.session.regenerate(err => {
      if (err) return reject(err);
      req.session.user = { id: user.id, roles: user.roles };
      req.session.save(saveErr => (saveErr ? reject(saveErr) : resolve()));
    });
  });

  res.json({ user: req.session.user });
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
};

// Post request to select a profile for the current session
// (profileId in body)
exports.selectProfile = async (req, res) => {
  try {
    // require an authenticated session user
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { profileId } = req.body;
    if (!profileId) {
      return res.status(400).json({ error: 'profileId is required' });
    }

    // Validate that the profile belongs to the session user
    const user = await User.findOne({ userId: req.session.user.id }).populate('profiles').lean();
    if (!user || !user.profiles.find(p => String(p._id) === String(profileId))) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Save it in the session and persist
    req.session.profileId = profileId;
    await new Promise((resolve, reject) => {
      req.session.save(err => (err ? reject(err) : resolve()));
    });

    res.json({ message: 'Profile selected', profileId });
  } catch (err) {
    throw err;
  }
};

// GET current authenticated user (from session)
exports.me = (req, res) => {
  if (!req.session?.user?.id) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  res.json({ user: req.session.user });
};