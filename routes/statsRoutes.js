const express = require('express');
const StatsController = require('../controllers/StatsController');

const router = express.Router();
const statsController = new StatsController();

// Get API statistics
router.get('/', statsController.getStats.bind(statsController));

module.exports = router;
