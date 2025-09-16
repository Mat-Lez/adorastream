const router = require('express').Router();
const Content = require('../controllers/content.controller');
const { requireLogin, requireAdmin } = require('../middleware/auth');

router.get('/',      (req, res, next) => Content.list(req, res).catch(next));
router.get('/:id',   (req, res, next) => Content.get(req, res).catch(next));
router.post('/',     requireLogin, requireAdmin, (req, res, next) => Content.create(req, res).catch(next));
router.patch('/:id', requireLogin, requireAdmin, (req, res, next) => Content.update(req, res).catch(next));
router.delete('/:id',requireLogin, requireAdmin, (req, res, next) => Content.remove(req, res).catch(next));

module.exports = router;