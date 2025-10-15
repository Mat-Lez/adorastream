/**
 * Centralized API utility functions
 */

/**
 * Generic API form submission function
 * @param {string} path - API endpoint
 * @param {FormData} formData - Form data to submit
 * @returns {Promise<Object>} - API response
 */
async function apiForm(path, formData) {
  try {
    const response = await fetch(path, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('API Form Error:', error);
    throw error;
  }
}

/**
 * Generic API request function
 * @param {string} path - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} body - Request body (optional)
 * @returns {Promise<Object>} - API response
 */
async function apiRequest(path, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(path, options);

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * Display success message
 * @param {string} message - Success message
 * @param {string} elementId - Element ID to display message
 */
function showSuccess(message, elementId = 'msg') {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.className = 'success';
  }
}

/**
 * Display error message
 * @param {string} message - Error message
 * @param {string} elementId - Element ID to display message
 */
function showError(message, elementId = 'msg') {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.className = 'error';
  }
}

/**
 * Clear message
 * @param {string} elementId - Element ID to clear
 */
function clearMessage(elementId = 'msg') {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = '';
    element.className = '';
  }
}

// Export functions for use in other files
export { apiForm, apiRequest, showSuccess, showError, clearMessage };
