const router = require('express').Router();
const StatsController = require('../../controllers/stats.controller');
const { requireLogin, requireProfileSelection } = require('../../middleware/auth');

router.get('/watchedContentByGenreByProfileID', requireLogin, requireProfileSelection, StatsController.watchedContentByGenreByProfileID);
router.get('/getDailyWatchCountByProfile', requireLogin, requireProfileSelection, StatsController.getDailyWatchCountByProfile);

module.exports = router;
