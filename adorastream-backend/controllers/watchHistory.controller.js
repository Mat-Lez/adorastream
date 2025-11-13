const WatchHistory = require('../models/watchHistory');
const Content = require('../models/content');
const User = require('../models/user');
const ContentController = require('../controllers/content.controller');



// Updates progress for a specific profileID + contentID combo
exports.upsertProgress = async (req, res) => {
  const userId = req.session.user.id;           // from session
  const profileId = req.session.user.profileId;
  const contentId = req.params.id;
  const { episodeId, positionSec, completed } = req.body;

  const content = await Content.findById(contentId).lean();
  if (!content) return res.status(404).json({ error: 'Content not found' });

  if (content.type === 'series') {
    if (!episodeId) return res.status(404).json({ error: 'Content not found' });
  }

  const update = {
    lastPositionSec: Math.max(0, positionSec || 0),
    completed: !!completed,
    lastWatchedAt: new Date(),
  };

// Define filter for unique record: profile + content + episode
  const filter = {
    userId,
    profileId,
    contentId,
    ...(content.type === 'series' ? { episodeId } : { episodeId: null }) // null for movies
  };

  const history = await WatchHistory.findOneAndUpdate(
    filter,
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

    if (!contentId) {
      return res.status(400).json({ success: false, error: 'contentId is required' });
    }

    const content = await Content.findById(contentId).lean();
    if (!content) return res.status(404).json({ success: false, error: 'Content not found' });

    let filter = { userId, profileId, contentId, episodeId: null };
    if (content.type === 'series')
      filter.type = 'series-like';

    const entry = await WatchHistory.findOneAndUpdate(
      filter,
      [{ $set: { liked: { $not: '$liked' } } }],
      { new: true, upsert: true }
    );

    res.json({ success: true, liked: entry.liked });
    } catch (err) {
      console.error('Error toggling like:', err);
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


exports.getProgress = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const profileId = req.session.user.profileId;
    const contentId = req.params.id;

    // Get the content
    const content = await Content.findById(contentId).lean();
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Filter out pseudo record for series progress
    let recordFilter = { userId, profileId, contentId, type: 'progress' };

    if (content.type === 'series') {
      recordFilter.episodeId = { $ne: null };
    }

    // Try to find a progress record for this content (any episode if series)
    let record = await WatchHistory.findOne(recordFilter)
      .sort({ lastWatchedAt: -1 })
      .lean();

    // Determine content duration
    let durationSec = 0;

    if (content.type === 'movie') {
      durationSec = content.durationSec || 0;
      if (!record) {
        // No watch history yet
        return res.json({
          exists: false,
          mediaType: 'movie',
          durationSec,
          lastPositionSec: 0,
          completed: false,
          liked: false,
        });
      }

      return res.json({
        exists: true,
        mediaType: 'movie',
        durationSec,
        lastPositionSec: record?.lastPositionSec || 0,
        completed: record?.completed || false,
        liked: record?.liked || false,
        lastWatchedAt: record.lastWatchedAt,
      });
    }

    if (content.type === 'series'){


      // get series like
      const pseudoRecord = await WatchHistory.findOne({
        userId,
        profileId,
        contentId,
        type: 'series-like',
        episodeId: null
      }).lean();

      const allEpisodes = ContentController._getSortedEpisodes(content);

      if (!record) {
        // Nothing watched yet - first episode
        const firstEp = allEpisodes[0];
        return res.json({
          mediaType: 'series',
          contentId,
          episodeId: firstEp?._id || null,
          durationSec: firstEp?.durationSec || 0,
          lastPositionSec: 0,
          completed: false,
          liked: pseudoRecord?.liked || false,
          lastWatchedAt: null,
        });
      }

      // Has a record
      let episodeId = record.episodeId;
      if (record.completed) 
        episodeId = findNextEpisode(content, episodeId)?._id || allEpisodes[0]._id;
      currentEp = allEpisodes.find(ep => ep._id.toString() === episodeId?.toString());

      // get watch history record of new episode
      record = await WatchHistory.findOne({
        userId,
        profileId,
        contentId,
        episodeId,
        type: 'progress'
      }).lean();

      if (!record) {
        return res.json({
          mediaType: 'series',
          contentId,
          episodeId: episodeId || null,
          durationSec: currentEp?.durationSec || 0,
          lastPositionSec: 0,
          completed: false,
          liked: pseudoRecord?.liked || false,
          lastWatchedAt: null,
        });
      }

      return res.json({
        mediaType: 'series',
        contentId,
        episodeId: episodeId || null,
        durationSec: currentEp?.durationSec || 0,
        lastPositionSec: record?.lastPositionSec || 0,
        completed: record?.completed || false,
        liked: pseudoRecord?.liked || false,
        lastWatchedAt: record?.lastWatchedAt,
      });
    }

  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};


function findNextEpisode(content, lastWatchedEpisodeId = null) {
  if (content.type !== 'series' || !Array.isArray(content.seasons)) {
    return null; // Only relevant for series
  }

  // Flatten all episodes (across all seasons) with season/episode info
  const allEpisodes = ContentController._getSortedEpisodes(content);

  if (!lastWatchedEpisodeId) {
    // Nothing watched yet → return the first episode
    return allEpisodes[0] || null;
  }

  const currentIndex = allEpisodes.findIndex(
    ep => ep._id.toString() === lastWatchedEpisodeId.toString()
  );

  // If not found or already last episode → no next episode
  if (currentIndex === -1 || currentIndex === allEpisodes.length - 1) {
    return null;
  }

  // Return the next episode
  return allEpisodes[currentIndex + 1];
}

exports.resetProgress = async (req, res) => {
  const contentId = req.params.id;
  const content = await Content.findById(contentId).lean();
  if (!content) return res.status(404).json({ error: 'Content not found' });

  const userId = req.session.user.id;           // from session
  const profileId = req.session.user.profileId;

  await WatchHistory.updateMany(
  { userId, profileId, contentId },
  { $set: { completed: false, lastPositionSec: 0 } }
  );
  res.status(204).send();
}