// Reuseable event listener for logout button - by default looks for element with id 'logout-btn'
function logoutEventListener(btnId = 'logout-btn') {
    const logout = document.getElementById(btnId);
    if (logout) {
        logout.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                // Redirect to login after logout
                window.location.href = '/login';
            } catch (err) {
                console.error('Logout failed:', err);
                window.location.href = '/login';
            }
        });
    }
}

// Export functions for use in other files
export { logoutEventListener };