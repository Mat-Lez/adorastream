const WatchHistory = require('../models/watchHistory');
const User = require('../models/user');



exports.upsertProgress = async (req, res) => {
  const userId = req.session.user.id;           // from session
  const { profileId, contentId, season, episode, positionSec, completed } = req.body;
  const update = {
    season: season ?? null,
    episode: episode ?? null,
    lastPositionSec: Math.max(0, positionSec || 0),
    completed: !!completed,
    lastWatchedAt: new Date()
  };
  const history = await WatchHistory.findOneAndUpdate(
    { userId, profileId, contentId },
    { $set: update },
    { upsert: true, new: true }
  );
  res.json(history);
};

exports.toggleLike = async (req, res) => {
  const userId = req.session.user.id;
  const { profileId, contentId, liked } = req.body;

  const history = await WatchHistory.findOneAndUpdate(
    { userId, profileId, contentId },
    { $set: { liked: !!liked, lastWatchedAt: new Date() } },
    { upsert: true, new: true }
  );

  res.json(history);
};


exports.listProfileHistory = async (req, res) => {
  const userId = req.session.user.id;
  const { profileId, completed, withContent, withProfiles } = req.query;

  const filter = { userId };
  if (profileId) filter.profileId = profileId;
  if (typeof completed !== 'undefined') filter.completed = completed === 'true';

  let q = WatchHistory.find(filter).sort({ lastWatchedAt: -1 });
  if (withContent === 'true') {
    q = q.populate({ path: 'contentId', select: 'title posterUrl year genres' });
  }
  const histories = await q.lean();

  if (withProfiles !== 'true') {
    return res.json({ histories, total: histories.length });
  }

  const userIds = [...new Set(histories.map(h => String(h.userId)))];
  const users = await User.find({ id: { $in: userIds } }).select('profiles').lean();
  const userMap = new Map(users.map(u => [String(u.id), u]));

  const rows = histories.map(h => {
    const u = userMap.get(String(h.userId));
    const p = u?.profiles?.find(p => String(p.id) === String(h.profileId));
    return { ...h, profileName: p?.name || '', profileAvatar: p?.avatarUrl || '' };
  });

  res.json({ histories: rows, total: rows.length });
};