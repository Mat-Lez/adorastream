const router = require('express').Router();
const Content = require('../models/Content');


// POST create new content
router.post('/', async (req, res, next) => {
  try { res.status(201).json(await Content.create(req.body)); }
  catch (e) { next(e); }
});


// GET search by query (title) and genre, sort, and paginate
router.get('/', async (req, res, next) => {
  try {
    const { q, genre, sortBy = 'createdAt', order = 'desc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (genre) filter.genres = genre;

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Content.find(filter).sort(sort).skip(skip).limit(limit),
      Content.countDocuments(filter)
    ]);

    res.json({ contents: items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});


// GET content by ID
router.get('/:id', async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json(content);
  } catch (e) { next(e); }
});


// PATCH update content by ID
router.patch('/:id', async (req, res, next) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json(content);
  } catch (e) { next(e); }
});


// DELETE content by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});