const router = require('express').Router();
const WatchHistory = require('../models/watchHistory');

// Update last watched (continue watching)
router.post('/progress', async (req, res, next) => {
  try {
    const { userId, profileId, contentId, season, episode, positionSec, completed } = req.body;
    const update = {
      season: season ?? null,
      episode: episode ?? null,
      lastPositionSec: Math.max(0, positionSec || 0),
      completed: !!completed,
      lastWatchedAt: new Date()
    };
    const doc = await WatchHistory.findOneAndUpdate(
      { userId, profileId, contentId },
      { $set: update },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (e) { next(e); }
});


// TOGGLE like
router.post('/like', async (req, res, next) => {
  try {
    const { userId, profileId, contentId, liked } = req.body;
    const doc = await WatchHistory.findOneAndUpdate(
      { userId, profileId, contentId },
      { $set: { liked: !!liked } },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (e) { next(e); }
});


// LIST history by profile (with content populated)
router.get('/', async (req, res, next) => {
  try {
    const { userId, profileId, completed } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (profileId) filter.profileId = profileId;
    if (typeof completed !== 'undefined') filter.completed = completed === 'true';

    const items = await WatchHistory.find(filter)
      .sort({ lastWatchedAt: -1 })
      .populate('contentId');
    res.json({ items, total: items.length });
  } catch (e) { next(e); }
});

// DELETE a single history entry
router.delete('/', async (req, res, next) => {
  try {
    const { userId, profileId, contentId } = req.body;
    const r = await WatchHistory.findOneAndDelete({ userId, profileId, contentId });
    if (!r) return res.status(404).json({ error: 'History not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;