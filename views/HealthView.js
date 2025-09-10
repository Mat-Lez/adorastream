class HealthView {
  // Render health check data
  renderHealth(healthData) {
    return {
      success: true,
      message: 'AdoraStream API is running',
      data: {
        status: healthData.status,
        timestamp: healthData.timestamp,
        uptime: Math.round(healthData.uptime * 100) / 100,
        memory: {
          used: Math.round(healthData.memory.used / 1024 / 1024 * 100) / 100,
          total: Math.round(healthData.memory.total / 1024 / 1024 * 100) / 100,
          unit: 'MB'
        },
        version: healthData.version
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

module.exports = HealthView;
