const Content = require('../models/content');
const { enrichMovieRatings } = require('../services/rating.service');
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
  const { q, genres = [], sortBy = 'createdAt', order = 'desc' } = req.query;
  const page  = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip  = (page - 1) * limit;

  const filter = {};
  if (q) filter.$text = { $search: q };

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