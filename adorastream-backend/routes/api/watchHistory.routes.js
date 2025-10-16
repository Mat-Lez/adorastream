const router = require('express').Router();
const History = require('../../controllers/watchHistory.controller');
const { requireLogin } = require('../../middleware/auth');

router.get('/',          requireLogin, (req, res, next) => History.listMine(req, res).catch(next));
router.post('/progress', requireLogin, (req, res, next) => History.upsertProgress(req, res).catch(next));
router.post('/like',     requireLogin, (req, res, next) => History.toggleLike(req, res).catch(next));

module.exports = router;
