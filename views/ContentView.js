class ContentView {
  // Render a single content item
  renderContent(content, message = null) {
    const response = {
      success: true,
      data: content
    };

    if (message) {
      response.message = message;
    }

    return response;
  }

  // Render a list of content items
  renderContentList(contentList, type = 'content') {
    const response = {
      success: true,
      count: contentList.length,
      data: contentList
    };

    if (type !== 'content') {
      response.type = type;
    }

    return response;
  }

  // Render error response
  renderError(message, details = null, statusCode = 500) {
    const response = {
      success: false,
      message: message
    };

    if (details) {
      response.error = details;
    }

    if (statusCode) {
      response.statusCode = statusCode;
    }

    return response;
  }

  // Render validation errors
  renderValidationErrors(errors) {
    return {
      success: false,
      message: 'Validation failed',
      errors: errors,
      statusCode: 400
    };
  }

  // Render not found error
  renderNotFound(resource = 'Content') {
    return {
      success: false,
      message: `${resource} not found`,
      statusCode: 404
    };
  }

  // Render created response
  renderCreated(content, message = 'Content created successfully') {
    return {
      success: true,
      message: message,
      data: content
    };
  }

  // Render updated response
  renderUpdated(content, message = 'Content updated successfully') {
    return {
      success: true,
      message: message,
      data: content
    };
  }

  // Render deleted response
  renderDeleted(content, message = 'Content deleted successfully') {
    return {
      success: true,
      message: message,
      data: content
    };
  }
}

module.exports = ContentView;
