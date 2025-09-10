const express = require('express');
const ContentController = require('../controllers/ContentController');

const router = express.Router();
const contentController = new ContentController();

// Get episodes by series ID
router.get('/:seriesId/episodes', contentController.getEpisodesBySeries.bind(contentController));

module.exports = router;
