const express = require('express');
const HealthController = require('../controllers/HealthController');

const router = express.Router();
const healthController = new HealthController();

// Health check endpoint
router.get('/', healthController.getHealth.bind(healthController));

module.exports = router;
