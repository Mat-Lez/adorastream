const bcrypt = require('bcrypt');
const User = require('../models/user');

async function ensureAdminFromEnv() {
  const adminUsername = String(process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  const force = false; // no forced password change

  if (!adminPassword) return; // nothing to do without a password

  let user = await User.findOne({ username: adminUsername });
  if (!user) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({ username: adminUsername, passwordHash, roles: ['admin'] });
    return;
  }

  const roles = new Set(user.roles || []);
  if (!roles.has('admin')) {
    roles.add('admin');
    user.roles = Array.from(roles);
  }
  // never force reset password automatically
  await user.save();
}

module.exports = { ensureAdminFromEnv };
