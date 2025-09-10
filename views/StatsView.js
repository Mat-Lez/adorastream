class StatsView {
  // Render statistics data
  renderStats(stats) {
    return {
      success: true,
      data: {
        total: stats.total,
        movies: stats.movies,
        series: stats.series,
        episodes: stats.episodes,
        averageRating: Math.round(stats.averageRating * 100) / 100,
        generatedAt: new Date().toISOString()
      }
    };
  }

  // Render error response
  renderError(message, details = null) {
    const response = {
      success: false,
      message: message
    };

    if (details) {
      response.error = details;
    }

    return response;
  }
}

module.exports = StatsView;
