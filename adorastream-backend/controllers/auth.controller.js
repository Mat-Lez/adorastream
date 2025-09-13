const bcrypt = require('bcrypt');
const User = require('../models/user');

function normEmail(email = '') {
  return String(email).trim().toLowerCase();
}

exports.register = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      const e = new Error('Email and password are required'); e.status = 400; throw e;
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      const e = new Error('Email already registered'); e.status = 400; throw e;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, roles: ['user'] });

    req.session.user = { id: user.id, roles: user.roles };

    res.status(201).json({ user: req.session.user });
  } catch (err) {
    // Safety net if two users try to register with the same email at the same time
    if (err && err.code === 11000) {
      err = new Error('Email already registered'); err.status = 400;
    }
    throw err;
  }
};

exports.login = async (req, res) => {
  const email = normEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    const e = new Error('Email and password are required'); e.status = 400; throw e;
  }

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const e = new Error('Invalid credentials'); e.status = 401; throw e;
  }

  req.session.user = { id: user.id, roles: user.roles };
  res.json({ user: req.session.user });
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
};