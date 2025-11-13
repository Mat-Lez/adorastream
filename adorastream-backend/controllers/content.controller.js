const Content = require('../models/content');
const WatchHistory = require('../models/watchHistory');
const { enrichMovieRatings, enrichSeriesRatings, enrichSeriesEpisodesRatings } = require('../services/rating.service');
const upload = require('../services/videoUpload.service');

const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function fetchRandomizedContents(matchFilter, { limit, skip = 0, seed }) {
  if (!limit || limit <= 0) {
    return { contents: [], total: 0 };
  }

  const normalizedSeed = (typeof seed === 'string' && seed.trim()) || 'default';

  // 1. Fetch only IDs to save memory
  const allIds = await Content.find(matchFilter).select('_id').lean();
  const total = allIds.length;

  if (!total) {
    return { contents: [], total: 0 };
  }

  // 2. Shuffle indices to get a random-but-stable order based on the seed
  const indices = Array.from({ length: total }, (_value, index) => index);
  const rng = createSeededRandom(normalizedSeed);

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // 3. Get IDs for the current page
  const selectedIndices = indices.slice(skip, skip + limit);
  const pageIds = selectedIndices.map(idx => allIds[idx]._id);

  if (!pageIds.length) {
    return { contents: [], total };
  }

  // 4. Fetch full documents for only the current page
  const pageContents = await Content.find({ _id: { $in: pageIds } }).lean();

  // 5. Preserve the shuffled order, as $in doesn't guarantee it
  const contentMap = new Map(pageContents.map(doc => [String(doc._id), doc]));
  const orderedContents = pageIds.map(id => contentMap.get(String(id)));

  return { contents: orderedContents, total };
}

function createSeededRandom(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;
  return function mulberry32() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function getPopularContents({ limit = 10, typeFilter, genreFilter, titleRegex } = {}) {
  const sanitizedLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  const pipeline = [
    { $match: { liked: true } },
    { $group: { _id: '$contentId', likes: { $sum: 1 } } },
    { $sort: { likes: -1 } },
    {
      $lookup: {
        from: 'contents',
        localField: '_id',
        foreignField: '_id',
        as: 'content'
      }
    },
    { $unwind: '$content' }
  ];

  const contentMatch = {};
  if (typeFilter) {
    contentMatch['content.type'] = typeFilter;
  }

  if (genreFilter) {
    contentMatch['content.genres'] = genreFilter;
  }

  if (titleRegex) {
    contentMatch['content.title'] = { $regex: titleRegex };
  }

  if (Object.keys(contentMatch).length > 0) {
    pipeline.push({ $match: contentMatch });
  }

  pipeline.push({ $limit: sanitizedLimit });

  const results = await WatchHistory.aggregate(pipeline).exec();
  return results.map(item => ({
    ...item.content,
    likes: item.likes
  }));
}

async function getUnwatchedContents(profileId, { limit = 10, typeFilter, genreFilter, titleRegex } = {}) {
  if (!profileId) {
    return [];
  }
  const sanitizedLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  const watchedIds = await WatchHistory.find({ profileId }).distinct('contentId');
  const filter = {
    _id: { $nin: watchedIds }
  };
  if (typeFilter) {
    filter.type = typeFilter;
  }
  if (genreFilter) {
    filter.genres = genreFilter;
  }
  if (titleRegex) {
     filter.title = { $regex: titleRegex };
  }
  return Content.find(filter)
    .sort({ createdAt: -1 })
    .limit(sanitizedLimit)
    .lean();
}

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
  const { q = '', sortBy = 'createdAt', order = 'desc' } = req.query;
  const rawGenres = req.query.genres;
  const filterBy = typeof req.query.filterBy === 'string' ? req.query.filterBy.trim() : '';
  const page  = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip  = (page - 1) * limit;

  const filter = {};
  const rawType = req.query.type;
  const rawSeed = typeof req.query.randomSeed === 'string' ? req.query.randomSeed.trim() : '';
  const useRandomOrdering = rawSeed.length > 0;
  
  if (rawType) {
    const normalizedType = String(rawType).trim().toLowerCase();
    if (['movie', 'series'].includes(normalizedType)) {
      filter.type = normalizedType;
    }
  }

  const searchTerm = String(q || '').trim();
  if (searchTerm) {
    filter.title = { $regex: escapeRegex(searchTerm), $options: 'i' };
  }

  const resolvedGenres = Array.isArray(rawGenres)
    ? rawGenres
    : (typeof rawGenres === 'string' && rawGenres.trim() ? [rawGenres.trim()] : []);
  if (resolvedGenres.length > 0) {
    filter.genres = { $in: resolvedGenres };
  }
  const filterGenre = resolvedGenres.length ? resolvedGenres[0] : '';

  const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

  const titleRegex = searchTerm ? new RegExp(escapeRegex(searchTerm), 'i') : null;
  const profileId = req.session?.user?.profileId || null;

  if (filterBy === 'popular') {
    const popularItems = await getPopularContents({ limit, typeFilter: filter.type, genreFilter: filterGenre, titleRegex });
    const popularCount = popularItems.length;
    return res.json({
      contents: popularItems,
      total: popularCount,
      page: 1,
      pages: popularCount > 0 ? 1 : 0
    });
  }

  if (filterBy === 'unwatched') {
    if (!profileId) {
      return res.json({ contents: [], total: 0, page: 1, pages: 0 });
    }
    const unwatched = await getUnwatchedContents(profileId, { limit, typeFilter: filter.type, genreFilter: filterGenre, titleRegex });
    const unwatchedCount = unwatched.length;
    return res.json({
      contents: unwatched,
      total: unwatchedCount,
      page: 1,
      pages: unwatchedCount > 0 ? 1 : 0
    });
  }

  let contents;
  let total;
  if (useRandomOrdering) {
    const result = await fetchRandomizedContents(filter, { limit, skip, seed: rawSeed });
    contents = result.contents;
    total = result.total;
  } else {
    [contents, total] = await Promise.all([
      Content.find(filter).sort(sort).skip(skip).limit(limit),
      Content.countDocuments(filter),
    ]);
  }

  res.json({ contents, total, page, pages: Math.ceil(total / limit) });
};


// GET content by ID
exports.get = async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) { const e = new Error('Content not found'); e.status = 404; throw e; }
  res.json(content);
};

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
      return res.json({ episode: ep, seasonNumber: season.seasonNumber, episodeNumber: ep.episodeNumber });
    }
  }
}

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

exports.fetchRandomizedContents = fetchRandomizedContents;
exports.getPopularContents = getPopularContents;
exports.getUnwatchedContents = getUnwatchedContents;
exports.getPopularContents = getPopularContents;
