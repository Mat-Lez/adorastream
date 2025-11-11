const router = require('express').Router();
const StatsController = require('../../controllers/stats.controller');
const { requireLogin, requireProfileSelection } = require('../../middleware/auth');

router.get('/watchedContentByGenreByProfileID', requireLogin, requireProfileSelection, StatsController.watchedContentByGenreByProfileID);

module.exports = router;
