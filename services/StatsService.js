const ContentModel = require('../models/ContentModel');

class StatsService {
  constructor() {
    this.contentModel = new ContentModel();
  }

  // Get comprehensive statistics
  async getStats() {
    try {
      const stats = this.contentModel.getStats();
      
      // Add additional calculated statistics
      const allContent = this.contentModel.getAll();
      const enhancedStats = {
        ...stats,
        averageRating: Math.round(stats.averageRating * 100) / 100,
        contentByYear: this.getContentByYear(allContent),
        topGenres: this.getTopGenres(allContent),
        averageDuration: this.getAverageDuration(allContent)
      };

      return enhancedStats;
    } catch (error) {
      throw new Error(`Failed to retrieve statistics: ${error.message}`);
    }
  }

  // Get content distribution by year
  getContentByYear(content) {
    const yearDistribution = {};
    content.forEach(item => {
      const year = item.releaseYear;
      if (!yearDistribution[year]) {
        yearDistribution[year] = { total: 0, movies: 0, series: 0, episodes: 0 };
      }
      yearDistribution[year].total++;
      yearDistribution[year][item.type + 's']++;
    });
    return yearDistribution;
  }

  // Get top genres
  getTopGenres(content) {
    const genreCount = {};
    content.forEach(item => {
      if (item.genre && Array.isArray(item.genre)) {
        item.genre.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });

    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));
  }

  // Get average duration by content type
  getAverageDuration(content) {
    const durations = {
      movies: content.filter(item => item.type === 'movie' && item.duration),
      episodes: content.filter(item => item.type === 'episode' && item.duration)
    };

    const averages = {};
    Object.keys(durations).forEach(type => {
      if (durations[type].length > 0) {
        const totalDuration = durations[type].reduce((sum, item) => sum + item.duration, 0);
        averages[type] = Math.round(totalDuration / durations[type].length);
      }
    });

    return averages;
  }
}

module.exports = StatsService;
