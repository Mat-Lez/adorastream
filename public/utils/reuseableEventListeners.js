// Reuseable event listener for logout button - by default looks for element with id 'logout-btn'
function logoutEventListener(btnId = 'logout-btn') {
    const logout = document.getElementById(btnId);
    if (logout) {
        logout.addEventListener('click', () => {
            // navigate to /logout route which will destroy the session
            window.location.href = '/logout';
        });
    }
}

// Export functions for use in other files
export { logoutEventListener };