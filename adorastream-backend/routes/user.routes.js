const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');


// POST create new user
router.post('/', async (req, res, next) => {
  try {
    const { email, password, roles } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, roles: roles || ['user'] });
    res.status(201).json(user);
  } catch (e) { next(e); }
});


// GET all users with pagination
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find().skip(skip).limit(limit),
      User.countDocuments()
    ]);
    res.json({ users: items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});


// GET user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { next(e); }
});


// PATCH update user by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const { email, roles } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(email && { email }), ...(roles && { roles }) },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) { next(e); }
});


// DELETE user by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});


// POST add profile to user
router.post('/:id/profiles', async (req, res, next) => {
  try {
    const { name, avatarUrl } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.profiles.length >= 5) return res.status(400).json({ error: 'Max 5 profiles' });
    user.profiles.push({ name, avatarUrl: avatarUrl || '' });
    await user.save();
    res.status(201).json(user);
  } catch (e) { next(e); }
});


// DELETE profile from user
router.delete('/:id/profiles/:profileId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const before = user.profiles.length;
    user.profiles = user.profiles.filter(p => p._id.toString() !== req.params.profileId);
    if (user.profiles.length === before) return res.status(404).json({ error: 'Profile not found' });
    await user.save();
    res.json(user);
  } catch (e) { next(e); }
});

module.exports = router;