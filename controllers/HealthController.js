const HealthView = require('../views/HealthView');

class HealthController {
  constructor() {
    this.healthView = new HealthView();
  }

  // Health check endpoint
  getHealth(req, res) {
    try {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      };
      
      const response = this.healthView.renderHealth(healthData);
      res.json(response);
    } catch (error) {
      const errorResponse = this.healthView.renderError('Health check failed', error.message);
      res.status(500).json(errorResponse);
    }
  }
}

module.exports = HealthController;
