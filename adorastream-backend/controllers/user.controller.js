const User = require('../models/user');


// GET list of users with pagination
exports.list = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit),
    User.countDocuments()
  ]);
  res.json({ users, total, page, pages: Math.ceil(total / limit) });
};


// GET user by ID
exports.get = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  res.json(user);
};


// PATCH update user by ID
exports.update = async (req, res) => {
  const { email, roles } = req.body;
  const update = {};
  if (email) update.email = email;
  if (roles && (req.session.user.roles || []).includes('admin')) update.roles = roles;
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  res.json(user);
};


// DELETE user by ID
exports.remove = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  res.json({ ok: true });
};


// POST add profile to user
exports.addProfile = async (req, res) => {
  const { name, avatarUrl } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  if (user.profiles.length >= 5) { const e = new Error('Max 5 profiles'); e.status = 400; throw e; }
  user.profiles.push({ name, avatarUrl: avatarUrl || '' });
  await user.save();
  res.status(201).json(user);
};


// DELETE profile from user
exports.removeProfile = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  const before = user.profiles.length;
  user.profiles = user.profiles.filter(p => String(p._id) !== String(req.params.profileId));
  if (user.profiles.length === before) { const e = new Error('Profile not found'); e.status = 404; throw e; }
  await user.save();
  res.json(user);
};