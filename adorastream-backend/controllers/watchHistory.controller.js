const WatchHistory = require('../models/watchHistory');
const Content = require('../models/content');
const User = require('../models/user');



// Updates progress for a specific profileID + contentID combo
exports.upsertProgress = async (req, res) => {
  const userId = req.session.user.id;           // from session
  const profileId = req.session.user.profileId;
  contentId = req.session.user.contentId;
  const { season, episode, positionSec, completed } = req.body;
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
  try {
    const userId = req.session.user.id;
    const profileId = req.session.user.profileId;
    const { contentId } = req.params;

    let entry = await WatchHistory.findOne({  userId, profileId, contentId });

    if (!entry) {
      entry = await WatchHistory.create({
        userId,
        profileId,
        contentId,
        liked: true
      });
    } else {
      entry.liked = !entry.liked; // toggle like
      await entry.save();
    }
    res.json({ success: true, liked: entry.liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


// Fetch history of a user
exports.listMine = async (req, res) => {
  const userId = req.session.user.id;
  const profileId = req.session.user.profileId
  const { completed, withContent, withProfiles } = req.query;

  const filter = { userId };
  if (profileId) filter.profileId = profileId;
  if (typeof completed !== 'undefined') filter.completed = completed === 'true';

  // Most recent first
  let q = WatchHistory.find(filter).sort({ lastWatchedAt: -1 });
  if (withContent === 'true') {
    q = q.populate({ path: 'contentId', select: 'title posterUrl year genres' });
  }

  // Run the query
  const histories = await q.lean();

  if (withProfiles !== 'true') {
    return res.json({ histories, total: histories.length });
  }

  const userIds = [...new Set(histories.map(h => String(h.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select('profiles').lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));

  const rows = histories.map(h => {
    const u = userMap.get(String(h.userId));
    const p = u?.profiles?.find(p => String(p._id) === String(h.profileId));
    return { ...h, profileName: p?.name || '', profileAvatar: p?.avatarPath || '' };
  });

  res.json({ histories: rows, total: rows.length });
};

// controllers/watchHistory.js
exports.getProgress = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const profileId = req.session.user.profileId;
    const { contentId } = req.query;

    const record = await WatchHistory.findOne({ userId, profileId, contentId }).lean();
    const duration = await Content.findById(contentId).select('durationSec').lean();

    if (!record) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      liked: record?.liked || false,
      completed: record.completed,
      lastPositionSec: record.lastPositionSecv|| 0,
      lastWatchedAt: record.lastWatchedAt,
      durationSec: duration?.durationSec || 0
    });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};