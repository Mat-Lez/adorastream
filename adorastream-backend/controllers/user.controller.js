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
  const { username, roles } = req.body;
  const update = {};
  if (username) update.username = username;
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


// POST add profile to user (supports avatar image upload)
exports.addProfile = async (req, res) => {
  const { name } = req.body;
  const file = req.file; // multer single('avatar')
  if (!name || !String(name).trim()) { const e = new Error('Name is required'); e.status = 400; throw e; }

  const user = await User.findById(req.params.id);
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  if (user.profiles.length >= 5) { const e = new Error('Max 5 profiles'); e.status = 400; throw e; }

  // Create profile first to get its ID
  user.profiles.push({ name: String(name).trim(), avatarPath: '' });
  const newProfile = user.profiles[user.profiles.length - 1];

  // If an avatar file was uploaded, persist to public/<userId>/<profileId>/avatar.ext
  if (!req.uploadError && file && file.path && file.originalname) {
    const path = require('path');
    const fs = require('fs');
    const safeUserId = String(user._id);
    const safeProfileId = String(newProfile._id);

    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
    const useExt = allowedExt.has(ext) ? ext : '.png';

    // Store under adorastream-backend/public/profile-photos/<userId>/<profileId>/
    const backendPublic = path.join(__dirname, '..', 'public');
    const dir = path.join(backendPublic, 'profile-photos', safeUserId, safeProfileId);
    await fs.promises.mkdir(dir, { recursive: true });
    const filename = `avatar${useExt}`;
    const absPath = path.join(dir, filename);
    // Move from multer temp path to final path (rename acts like move on same disk)
    await fs.promises.rename(file.path, absPath);

    // Save relative path from backend public/
    const relPath = path.join('profile-photos', safeUserId, safeProfileId, filename).replace(/\\/g, '/');
    newProfile.avatarPath = relPath;
  }

  await user.save();
  const response = user.toObject ? user.toObject() : user;
  if (req.uploadError) {
    response.warnings = [req.uploadError];
  }
  res.status(201).json(response);
};


// DELETE profile from user
exports.removeProfile = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  const profileId = String(req.params.profileId);
  const before = user.profiles.length;
  const toRemove = user.profiles.find(p => String(p._id) === profileId);
  user.profiles = user.profiles.filter(p => String(p._id) !== profileId);
  if (user.profiles.length === before) { const e = new Error('Profile not found'); e.status = 404; throw e; }
  await user.save();
  // Best-effort delete avatar folder under backend public/profile-photos/<userId>/<profileId>
  try {
    const path = require('path');
    const fs = require('fs');
    const backendPublic = path.join(__dirname, '..', 'public');
    const dir = path.join(backendPublic, 'profile-photos', String(user._id), profileId);
    await fs.promises.rm(dir, { recursive: true, force: true });
  } catch (err) {
    // Log cleanup failure for observability; profile already deleted in DB
    console.warn('Avatar cleanup failed', {
      userId: String(user._id),
      profileId,
      error: err?.message || String(err)
    });
  }
  res.json(user);
};