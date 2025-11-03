const Content = require('../models/content');
const { enrichSeriesRatings, enrichSeriesEpisodesRatings } = require('../services/rating.service');

// POST /api/series - create a new series (and base content)
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
    posterUrl = `/static/posters/${req.files.poster[0].filename}`;
  }

  // Parse genres
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

  // fire-and-forget enrichment
  enrichSeriesRatings(seriesContent).catch(() => {});

  res.status(201).json(seriesContent);
};

// GET /api/series - list all series (lightweight)
exports.listSeries = async (req, res) => {
  const series = await Content.find({ type: 'series' }).select('title creators numberOfSeasons');
  res.json(series);
};

// GET /api/series/:id - get series with seasons and episodes
exports.getSeries = async (req, res) => {
  const series = await Content.findById(req.params.id);
  if (!series || series.type !== 'series') { const e = new Error('Series not found'); e.status = 404; throw e; }
  res.json(series);
};

// POST /api/series/:id/episodes - add episode, auto-create season if missing
exports.addEpisode = async (req, res) => {
  const seriesId = req.params.id;
  const {
    title,
    description,
    seasonNumber,
    episodeNumber,
    director,
    actors,
    nextEpisodeId
  } = req.body;

  const series = await Content.findById(seriesId);
  if (!series || series.type !== 'series') { const e = new Error('Series not found'); e.status = 404; throw e; }

  // Parse actors
  let actorsArr = [];
  if (actors) {
    try { actorsArr = JSON.parse(actors); } catch (_) { actorsArr = []; }
  }

  // Files
  let posterUrl = '';
  let videoUrl = '';
  if (req.files && req.files.poster && req.files.poster[0]) {
    posterUrl = `/static/posters/${req.files.poster[0].filename}`;
  }
  if (req.files && req.files.video && req.files.video[0]) {
    videoUrl = `/static/videos/${req.files.video[0].filename}`;
  }

  // Ensure season exists
  const seasonNum = Number(seasonNumber);
  const epNum = Number(episodeNumber);
  // Find or create season inside the series content
  if (!Array.isArray(series.seasons)) series.seasons = [];
  let season = series.seasons.find(s => s.seasonNumber === seasonNum);
  if (!season) {
    season = { seasonNumber: seasonNum, episodes: [] };
    series.seasons.push(season);
  }

  // Uniqueness check for episode number
  const exists = (season.episodes || []).some(e => e.episodeNumber === epNum);
  if (exists) {
    const e = new Error('Episode already exists in this season');
    e.status = 409;
    throw e;
  }

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

  // bump numberOfSeasons if needed
  if ((series.numberOfSeasons || 0) < seasonNum) {
    series.numberOfSeasons = seasonNum;
  }

  await series.save();

  // Enrich just-added episode (use series title + season/episode)
  enrichSeriesEpisodesRatings(series.id, [{ seasonNumber: seasonNum, episodeNumber: epNum }]).catch(() => {});

  res.status(201).json(series);
};

// POST /api/series/:id/episodes-batch - add multiple episodes in one request
exports.addEpisodesBatch = async (req, res) => {
  const seriesId = req.params.id;
  const series = await Content.findById(seriesId);
  if (!series || series.type !== 'series') { const e = new Error('Series not found'); e.status = 404; throw e; }

  // episodes as JSON string array
  let episodes = [];
  try { episodes = JSON.parse(req.body.episodes || '[]'); } catch (_) { episodes = []; }

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
    if (exists) { return; }
    const posterUrl = posters[idx] ? `/static/posters/${posters[idx].filename}` : '';
    const videoUrl  = videos[idx]  ? `/static/videos/${videos[idx].filename}`   : '';
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
    if ((series.numberOfSeasons || 0) < seasonNum) {
      series.numberOfSeasons = seasonNum;
    }
  });

  await series.save();

  // Enrich added episodes
  const specs = episodes.map(ep => ({ seasonNumber: ep.seasonNumber, episodeNumber: ep.episodeNumber }));
  enrichSeriesEpisodesRatings(series.id, specs).catch(() => {});
  res.status(201).json(series);
};


