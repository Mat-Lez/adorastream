import { fetchPage } from "../utils/pageManagement.js";

function settingsPageNavbarPageSwapListener() {
    // This is a document event listener. Since the settings page is loaded after the main page was loaded
    // there is no way to load this JS file. Therefore, it is needed to load this file when loading the main page.
    // Since, at that point in time the settings page elements were not loaded yet, a document event listener is needed
    // while utilizing  `closest` in order to assess if link related to the settings page was clicked.
    document.addEventListener('click', async (event) => {
        const clickedLink = event.target.closest('a');
        if (!clickedLink) {
            return;
        }

        const settingsContainer = clickedLink.closest('.settings-layout-container');
        if (!settingsContainer) {
            return; // Click was not inside the settings area, ignore.
        }

        const isSettingsNav = clickedLink.closest('.settings-nav');
        const isSettingsContentLink = clickedLink.closest('.settings-content-area');

        // Only intercept clicks on settings nav links or links within the content area.
        if (!isSettingsNav && !isSettingsContentLink) {
            return;
        }
        event.preventDefault();

        if (isSettingsNav) {
            // if the clicked page is active do not refetch the page from the server, just return
            if (clickedLink.classList.contains('active')) {
                return;
            }
            
            // Update active state for nav links
            document.querySelectorAll('.settings-nav-item').forEach(link => {
                link.classList.remove('active');
            });
            clickedLink.classList.add('active');

            const contentArea = document.querySelector('.settings-content-area');
            const page = clickedLink.dataset.page;
            await fetchPage(`/settings/${page}`, contentArea, "loading");
        }
    });
}

// Global page scripts are those that do not need to be reinitialized on every page load
function initGlobalPageScripts() {
  settingsPageNavbarPageSwapListener();
}

document.addEventListener('DOMContentLoaded', () => {
    initGlobalPageScripts();
});