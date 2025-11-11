const router = require('express').Router();
const History = require('../../controllers/watchHistory.controller');
const { requireLogin, requireProfileSelection } = require('../../middleware/auth');

router.get('/',          requireLogin, requireProfileSelection, (req, res, next) => History.listMine(req, res).catch(next));
router.post('/:id/progress', requireLogin, requireProfileSelection, (req, res, next) => History.upsertProgress(req, res).catch(next));
router.get('/:id/progress', requireLogin, requireProfileSelection, (req, res, next) => History.getProgress(req, res).catch(next));
router.post('/:contentId/like', requireLogin, requireProfileSelection, (req, res, next) => History.toggleLike(req, res).catch(next));
router.post('/:id/reset-progress', requireLogin, requireProfileSelection, (req, res, next) => History.resetProgress(req, res).catch(next));

module.exports = router;
