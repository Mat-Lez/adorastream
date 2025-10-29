const Content = require('../models/content');
const { enrichMovieRatings, enrichSeriesRatings, enrichSeriesEpisodesRatings } = require('../services/rating.service');
const upload = require('../services/videoUpload.service');
const WatchHistory = require('../models/watchHistory');


const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST create new content
exports.create = async (req, res) => {
   // Extract and parse fields
  const {
    title,
    type,
    year,
    genres,
    director,
    actors,
    description,
    durationSec
  } = req.body;

  const normalizedTitle = String(title || '').trim();
  if (!normalizedTitle) {
    const err = new Error('Title is required');
    err.status = 400;
    throw err;
  }

  const existingContent = await Content.findOne({ title: { $regex: new RegExp(`^${normalizedTitle}$`, 'i') } }).lean()
  if (existingContent) {
    const err = new Error('Content with this title already exists');
    err.status = 409;
    throw err;
  }

  // Parse genres
  const genresArr = typeof genres === 'string'
    ? genres.split(',').map(g => g.trim()).filter(Boolean)
    : [];

  // Parse actors (now comes as JSON string from frontend)
  let actorsArr = [];
  if (actors) {
    try {
      actorsArr = JSON.parse(actors);
    } catch (e) {
      // Fallback to empty array if parsing fails
      actorsArr = [];
    }
  }

  // Handle files
  let posterUrl = '';
  let videoUrl = '';
  if (req.files && req.files.poster && req.files.poster[0]) {
    posterUrl = `/assets/posters/${req.files.poster[0].filename}`;
  }
  if (req.files && req.files.video && req.files.video[0]) {
    videoUrl = `/assets/videos/${req.files.video[0].filename}`;
  }

  // Create content
  const content = await Content.create({
    title: normalizedTitle,
    type,
    year,
    genres: genresArr,
    director,
    actors: actorsArr,
    synopsis: description,
    posterUrl,
    videoUrl,
    durationSec: parseInt(durationSec, 10) || 0
  });

  // Fire-and-forget enrichment; do not block API response
  enrichMovieRatings(content).catch(() => {});
  res.status(201).set('Location', `/api/content/${content.id}`).json(content);
};


//
exports.list = async (req, res) => {
  const { q, genres = [], sortBy = 'createdAt', order = 'desc' } = req.query;
  const page  = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip  = (page - 1) * limit;

  const filter = {};
  const rawType = req.query.type;
  
  if (rawType) {
    const normalizedType = String(rawType).trim().toLowerCase();
    if (['movie', 'series'].includes(normalizedType)) {
      filter.type = normalizedType;
    }
  }

  if (q) {
    const searchTerm = String(q).trim();
    if (searchTerm) {
      filter.title = { $regex: escapeRegex(searchTerm), $options: 'i' };
    }
  }

  // genres is expected to be an array: ?genres=Drama&genres=Sci-Fi
  if (Array.isArray(genres) && genres.length > 0) {
    filter.genres = { $in: genres };
  }

  const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

  const [contents, total] = await Promise.all([
    Content.find(filter).sort(sort).skip(skip).limit(limit),
    Content.countDocuments(filter)
  ]);

  res.json({ contents, total, page, pages: Math.ceil(total / limit) });
};

// GET content by ID
exports.get = async (req, res) => {
  const content = await Content.findById(req.params.id).lean();
  if (!content) { const e = new Error('Content not found'); e.status = 404; throw e; }
  res.json(content);
}


// PATCH update content by ID
exports.update = async (req, res) => {
  const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!content) { const e = new Error('Content not found'); e.status = 404; throw e; }
  res.json(content);
};


// DELETE content by ID
exports.remove = async (req, res) => {
  const content = await Content.findByIdAndDelete(req.params.id);
  if (!content) { const e = new Error('Content not found'); e.status = 404; throw e; }
  res.json({ ok: true });
};

// ========== Series-specific handlers (consolidated) ==========

// POST /api/series - create a new series
exports.createSeries = async (req, res) => {
  const { title, creators, numberOfSeasons, genres, description } = req.body;
  const normalizedTitle = String(title || '').trim();

  if (!normalizedTitle) {
    const err = new Error('Title is required');
    err.status = 400;
    throw err;
  }

  const existingTitle = await Content.findOne({ title: { $regex: new RegExp(`^${normalizedTitle}$`, 'i') } }).lean();
  if (existingTitle) {
    const err = new Error('Content with this title already exists');
    err.status = 409;
    throw err;
  }

  let creatorsArr = [];
  if (creators) {
    creatorsArr = Array.isArray(creators)
      ? creators
      : String(creators).split(',').map(s => s.trim()).filter(Boolean);
  }

  let posterUrl = '';
  if (req.files && req.files.poster && req.files.poster[0]) {
    posterUrl = `/assets/posters/${req.files.poster[0].filename}`;
  }

  const genresArr = typeof genres === 'string'
    ? genres.split(',').map(g => g.trim()).filter(Boolean)
    : [];

  const seriesContent = await Content.create({
    type: 'series',
    title: normalizedTitle,
    synopsis: description || '',
    creators: creatorsArr,
    numberOfSeasons: Number(numberOfSeasons) || 0,
    genres: genresArr,
    posterUrl,
    seasons: []
  });

  enrichSeriesRatings(seriesContent).catch(err => console.error('Failed to enrich series ratings:', err));
  res.status(201).json(seriesContent);
};

// GET /api/series
exports.listSeries = async (req, res) => {
  const series = await Content.find({ type: 'series' }).select('title creators numberOfSeasons');
  res.json(series);
};

// GET /api/series/:id
exports.getSeries = async (req, res) => {
  const series = await Content.findById(req.params.id);
  if (!series || series.type !== 'series') { const e = new Error('Series not found'); e.status = 404; throw e; }
  res.json(series);
};

// POST /api/series/:id/episodes
exports.addEpisode = async (req, res) => {
  const seriesId = req.params.id;
  const { title, description, seasonNumber, episodeNumber, director, actors, nextEpisodeId, durationSec } = req.body;

  const series = await Content.findById(seriesId);
  if (!series || series.type !== 'series') { const e = new Error('Series not found'); e.status = 404; throw e; }

  let actorsArr = [];
  if (actors) {
    try {
      actorsArr = JSON.parse(actors);
    } catch (e) {
      const err = new Error('Invalid JSON in actors field');
      err.status = 400;
      throw err;
    }
  }

  let posterUrl = '';
  let videoUrl = '';
  if (req.files && req.files.poster && req.files.poster[0]) {
    posterUrl = `/assets/posters/${req.files.poster[0].filename}`;
  }
  if (req.files && req.files.video && req.files.video[0]) {
    videoUrl = `/assets/videos/${req.files.video[0].filename}`;
  }

  const seasonNum = Number(seasonNumber);
  const epNum = Number(episodeNumber);
  if (!Array.isArray(series.seasons)) series.seasons = [];
  let season = series.seasons.find(s => s.seasonNumber === seasonNum);
  if (!season) {
    season = { seasonNumber: seasonNum, episodes: [] };
    series.seasons.push(season);
  }
    const exists = (season.episodes || []).some(e => e.episodeNumber === epNum);
    if (exists) { const e = new Error('Episode already exists in this season'); e.status = 409; throw e; }
    const titleExists = (season.episodes || []).some(e => e.title?.trim().toLowerCase() === String(title || '').trim().toLowerCase());
    if (titleExists) { const e = new Error('Episode with this title already exists in this season'); e.status = 409; throw e; }

  const episodeDoc = {
    seasonNumber: seasonNum,
    episodeNumber: epNum,
    title,
    synopsis: description || '',
    director: director || '',
    actors: actorsArr,
    posterUrl,
    videoUrl,
    durationSec: parseInt(durationSec, 10) || 0,
    nextEpisode: nextEpisodeId || null
  };
  season.episodes.push(episodeDoc);
  if ((series.numberOfSeasons || 0) < seasonNum) series.numberOfSeasons = seasonNum;
  await series.save();

  enrichSeriesEpisodesRatings(series.id, [{ seasonNumber: seasonNum, episodeNumber: epNum }]).catch(err => console.error('Failed to enrich episode ratings:', err));
  res.status(201).json(series);
};

// POST /api/series/:id/episodes-batch
exports.addEpisodesBatch = async (req, res) => {
  const seriesId = req.params.id;
  const series = await Content.findById(seriesId);
  if (!series || series.type !== 'series') { const e = new Error('Series not found'); e.status = 404; throw e; }

  let episodes = [];
  try {
    episodes = JSON.parse(req.body.episodes || '[]');
  } catch (e) {
    const err = new Error('Invalid JSON in episodes field');
    err.status = 400;
    throw err;
  }

  const posters = (req.files && req.files.posters) || [];
  const videos  = (req.files && req.files.videos)  || [];

  const seasons = Array.isArray(series.seasons) ? series.seasons : (series.seasons = []);
  const batchSeen = new Set();
  const batchTitlesBySeason = new Map();
  for (const ep of episodes) {
    const seasonNum = Number(ep.seasonNumber || 1);
    const epNum = Number(ep.episodeNumber || 1);
    const title = String(ep.title || '').trim().toLowerCase();
    const key = `${seasonNum}:${epNum}`;

    if (batchSeen.has(key)) {
      const err = new Error(`Duplicate episode ${seasonNum}x${epNum} in request`);
      err.status = 409;
      throw err;
    }
    batchSeen.add(key);

    if (title) {
      if (!batchTitlesBySeason.has(seasonNum)) {
        batchTitlesBySeason.set(seasonNum, new Set());
      }
      const seasonTitles = batchTitlesBySeason.get(seasonNum);
      if (seasonTitles.has(title)) {
        const err = new Error(`Duplicate episode title "${ep.title}" in request for season ${seasonNum}`);
        err.status = 409;
        throw err;
      }
      seasonTitles.add(title);
    }

    const season = seasons.find(s => s.seasonNumber === seasonNum);
    if (season && (season.episodes || []).some(e => e.episodeNumber === epNum)) {
      const err = new Error(`Episode ${seasonNum}x${epNum} already exists`);
      err.status = 409;
      throw err;
    }
    if (season && title && (season.episodes || []).some(e => String(e.title || '').trim().toLowerCase() === title)) {
      const err = new Error(`Episode title "${ep.title}" already exists in season ${seasonNum}`);
      err.status = 409;
      throw err;
    }
  }

  if (!Array.isArray(series.seasons)) series.seasons = [];
  episodes.forEach((ep, idx) => {
    const seasonNum = Number(ep.seasonNumber || 1);
    const epNum = Number(ep.episodeNumber || 1);
    let season = series.seasons.find(s => s.seasonNumber === seasonNum);
    if (!season) {
      season = { seasonNumber: seasonNum, episodes: [] };
      series.seasons.push(season);
    }
    const exists = (season.episodes || []).some(e => e.episodeNumber === epNum);
    if (exists) return;
    const posterUrl = posters[idx] ? `/assets/posters/${posters[idx].filename}` : '';
    const videoUrl  = videos[idx]  ? `/assets/videos/${videos[idx].filename}`   : '';
    const actorsArr = Array.isArray(ep.actors) ? ep.actors : [];
    const normalizedTitle = String(ep.title || '').trim();
    season.episodes.push({
      seasonNumber: seasonNum,
      episodeNumber: epNum,
      title: normalizedTitle,
      synopsis: ep.description || '',
      director: ep.director || '',
      actors: actorsArr,
      posterUrl,
      videoUrl,
      durationSec: parseInt(ep.durationSec, 10) || 0,
      nextEpisode: null
    });
    if ((series.numberOfSeasons || 0) < seasonNum) series.numberOfSeasons = seasonNum;
  });

  await series.save();

  const specs = episodes.map(ep => ({ seasonNumber: ep.seasonNumber, episodeNumber: ep.episodeNumber }));
  enrichSeriesEpisodesRatings(series.id, specs).catch(err => console.error('Failed to enrich episode ratings in batch:', err));
  res.status(201).json(series);
};

// Get Id of the next episode based on the one currently playing
exports.getNextEpisodeId = async (req, res) => {
  // require an authenticated session user
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.session?.user?.profileId) {
    return res.status(401).json({ error: 'No profile selected' });
  }

  const contentId = req.session.user.contentId;
  const currentEpisodeId = req.session.user.currentEpisodeId;

  if (!contentId) {
    return res.status(400).json({ error: 'No content selected' });
  }

  const content = await Content.findById(contentId);
  if (!content) { const e = new Error('Content not found'); e.status = 404; throw e; }

  let currentEpisode = null;
  let nextEpisode = null;

  if (content.type === 'series') {
    const allEpisodes = _getSortedEpisodes(content);

    currentEpisode = allEpisodes.find(ep => ep._id.toString() === currentEpisodeId) || allEpisodes[0];
    const currentIndex = allEpisodes.indexOf(currentEpisode);
    nextEpisode = allEpisodes[currentIndex + 1] || null;
  }
   // Save it in the session and persist
  req.session.user.contentId = content.id;
  let nextEpisodeId = nextEpisode ? nextEpisode._id : null;
  req.session.user.currentEpisodeId = nextEpisodeId;

  await new Promise((resolve, reject) => {
    req.session.save(err => (err ? reject(err) : resolve()));
  });
  res.json({ "contentId": contentId, "nextEpisodeId": nextEpisodeId });
}


exports.currentlyPlayed = async (req, res) => {
  if (!req.session?.user?.id || !req.session?.user?.profileId) {
    return res.status(401).json({ error: 'Not authenticated or profile not selected' });
  }

  const contentId = req.session.user.contentId;
  const currentEpisodeId = req.session.user.currentEpisodeId || null;
  if (!contentId) return res.status(400).json({ error: 'No content selected' });
  const content = await Content.findById(contentId);
  if (!content) throw Object.assign(new Error('Content not found'), { status: 404 });

  return res.json({ contentId: contentId, currentEpisodeId: currentEpisodeId, type: content.type });
};

exports.getSeasonEpisodeById = async (req, res) => {
  const contentId = req.params.id;
  const episodeId = req.params.episodeId;

  const content = await Content.findById(contentId);

  if (!content || content.type !== 'series' || !Array.isArray(content.seasons)) return res.status(404).json({ error: 'Content is not a series or has no seasons' });

  for (const season of content.seasons) {
    const ep = season.episodes.find(e => e._id.toString() === episodeId.toString());
    if (ep) {
      return res.json({ seasonNumber: season.seasonNumber, episodeNumber: ep.episodeNumber });
    }
  }
  return res.json(null);
}

// helper function
function _getSortedEpisodes(content) {
  if (!content?.seasons || !Array.isArray(content.seasons)) return [];

  const episodes = [];
  for (const season of content.seasons) {
    if (!season?.episodes) continue;
    for (const ep of season.episodes) {
      episodes.push({
        ...ep.toObject?.() ?? ep,
        seasonNumber: season.seasonNumber ?? 1,
      });
    }
  }

  return episodes.sort((a, b) =>
    a.seasonNumber === b.seasonNumber
      ? a.episodeNumber - b.episodeNumber
      : a.seasonNumber - b.seasonNumber
  );
}


exports.getSeasonEpisodeById = async (req, res) => {
  const contentId = req.params.id;
  const episodeId = req.params.episodeId;

  const content = await Content.findById(contentId);

  if (!content || content.type !== 'series' || !Array.isArray(content.seasons)) return null;

  for (const season of content.seasons) {
    const ep = season.episodes.find(e => e._id.toString() === episodeId.toString());
    if (ep) {
      return res.json({ seasonNumber: season.seasonNumber, episodeNumber: ep.episodeNumber });
    }
  }
  // Save it in the session and persist
  req.session.user.contentId = content.id;
  let nextEpisodeId = nextEpisode ? nextEpisode._id : null;
  req.session.user.currentEpisodeId = nextEpisodeId;

  await new Promise((resolve, reject) => {
    req.session.save(err => (err ? reject(err) : resolve()));
  });
  res.json({ "contentId": contentId, "nextEpisodeId": nextEpisodeId });
}


// Get info of currently played media - contentId, episodeId and media type
exports.currentlyPlayed = async (req, res) => {
  if (!req.session?.user?.id || !req.session?.user?.profileId) {
    return res.status(401).json({ error: 'Not authenticated or profile not selected' });
  }

  const contentId = req.session.user.contentId;
  const currentEpisodeId = req.session.user.currentEpisodeId;
  if (!contentId) return res.status(400).json({ error: 'No content selected' });

  const content = await Content.findById(contentId);
  if (!content) throw Object.assign(new Error('Content not found'), { status: 404 });

  return res.json({ contentId: contentId, currentEpisodeId: currentEpisodeId, type: content.type });
};


// Get all episodes of a certain sereis
exports.getEpisodesForSeries = async (req, res) => {

  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ error: 'Content not found' });

  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!req.session?.user?.profileId) {
    return res.status(401).json({ error: 'No profile selected' });
  }

  if (content.type !== 'series') return res.json({ episodes: [] });

  const episodes = _getSortedEpisodes(content);
  
  // Determine current episode from session
  const currentEpisodeId = req.session.user.currentEpisodeId;
  const currentEpisodeIndex = episodes.findIndex(ep => ep._id.toString() === currentEpisodeId);

  res.json({
    episodes,
    currentEpisodeIndex,
    totalSeasons: content.seasons.length
  });
};


exports._getSortedEpisodes = _getSortedEpisodes;

const DEFAULT_GENRE_LIMIT = Number(process.env.DEFAULT_GENRE_LIMIT) || 10;
const GENRE_FETCH_LIMIT_MULTIPLIER = Number(process.env.GENRE_FETCH_LIMIT_MULTIPLIER) || 25;
const GRID_CONTENT_LIMIT = Number(process.env.GRID_CONTENT_LIMIT) || 36;

exports.getGenreSections = async (limit = DEFAULT_GENRE_LIMIT) => {
  const contents = await Content.find({})
    .sort({ createdAt: -1 })
    .limit(limit * GENRE_FETCH_LIMIT_MULTIPLIER)
    .lean();

  const genreMap = new Map();
  for (const content of contents) {
    const genres = Array.isArray(content.genres) ? content.genres : [];
    for (const rawGenre of genres) {
      const genre = String(rawGenre || '').trim();
      if (!genre) continue;
      const bucket = genreMap.get(genre) || [];
      if (bucket.length >= limit) continue;
      bucket.push({
        id: String(content._id),
        title: content.title || 'Untitled',
        posterUrl: content.posterUrl || '/adorastream.png',
        type: content.type || 'Unknown'
      });
      genreMap.set(genre, bucket);
    }
  }

  return Array.from(genreMap.entries())
    .map(([genre, items]) => ({ genre, items }))
    .filter(section => section.items.length > 0)
    .sort((a, b) => a.genre.localeCompare(b.genre));
};

exports.getContentGrid = async (typeFilter, limit = GRID_CONTENT_LIMIT) => {
  const filter = {};
  if (typeFilter) {
    filter.type = typeFilter;
  }
  return Content.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};