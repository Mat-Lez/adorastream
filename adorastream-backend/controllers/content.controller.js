const Content = require('../models/content');
const { enrichMovieRatings, enrichSeriesRatings, enrichSeriesEpisodesRatings } = require('../services/rating.service');
const upload = require('../services/videoUpload.service');

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
    description
  } = req.body;

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
    title,
    type,
    year,
    genres: genresArr,
    director,
    actors: actorsArr,
    synopsis: description,
    posterUrl,
    videoUrl
  });

  // Fire-and-forget enrichment; do not block API response
  enrichMovieRatings(content).catch(() => {});
  res.status(201).set('Location', `/api/content/${content.id}`).json(content);
};


//
exports.list = async (req, res) => {
  const { q, genres = [], sortBy = 'createdAt', order = 'desc', type } = req.query;
  const page  = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip  = (page - 1) * limit;

  const filter = {};
  if (q) filter.$text = { $search: q };

  // filter by content type (movie/series)
  if (type) filter.type = type;

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
    title,
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
  const { title, description, seasonNumber, episodeNumber, director, actors, nextEpisodeId } = req.body;

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

  const episodeDoc = {
    seasonNumber: seasonNum,
    episodeNumber: epNum,
    title,
    synopsis: description || '',
    director: director || '',
    actors: actorsArr,
    posterUrl,
    videoUrl,
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
    season.episodes.push({
      seasonNumber: seasonNum,
      episodeNumber: epNum,
      title: ep.title || '',
      synopsis: ep.description || '',
      director: ep.director || '',
      actors: actorsArr,
      posterUrl,
      videoUrl,
      nextEpisode: null
    });
    if ((series.numberOfSeasons || 0) < seasonNum) series.numberOfSeasons = seasonNum;
  });

  await series.save();

  const specs = episodes.map(ep => ({ seasonNumber: ep.seasonNumber, episodeNumber: ep.episodeNumber }));
  enrichSeriesEpisodesRatings(series.id, specs).catch(err => console.error('Failed to enrich episode ratings in batch:', err));
  res.status(201).json(series);
};