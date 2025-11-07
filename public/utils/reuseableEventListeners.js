import { apiRequest as api } from './api-utils.js';

// Reuseable event listener for logout button - by default looks for element with id 'logout-btn'
function logoutEventListener(btnId = 'logout-btn') {
  document.body.addEventListener('click', async (e) => {
    const logoutButton = e.target.closest(`#${btnId}`);
    if (logoutButton) {
        e.preventDefault();
        try {
            const response = await api('/api/auth/logout', 'POST');
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout failed:', err);
            window.location.href = '/login';
        }
        return;
    }
    });
}

// Export functions for use in other files
export { logoutEventListener };