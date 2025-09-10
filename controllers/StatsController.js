const StatsService = require('../services/StatsService');
const StatsView = require('../views/StatsView');

class StatsController {
  constructor() {
    this.statsService = new StatsService();
    this.statsView = new StatsView();
  }

  // Get API statistics
  async getStats(req, res) {
    try {
      const stats = await this.statsService.getStats();
      const response = this.statsView.renderStats(stats);
      res.json(response);
    } catch (error) {
      const errorResponse = this.statsView.renderError('Failed to get statistics', error.message);
      res.status(500).json(errorResponse);
    }
  }
}

module.exports = StatsController;
