import { fetchPage } from "../utils/pageManagement.js";
import { apiRequest, apiForm, showSuccess, showError } from '/utils/api-utils.js';

const ACTIONS = {
    AddProfile: "add",
    EditProfile: "edit"
};

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

        const contentArea = document.querySelector('.settings-content-area');

        // Handle settings side navbar
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

            const page = clickedLink.dataset.page;
            await fetchPage(`/settings/${page}`, contentArea, "loading");

        // Handle inside content area links
        } else if (isSettingsContentLink) {
            if (clickedLink.classList.contains('form-back-link')) {
                const currentlyActiveNav = document.querySelector('.settings-nav-item.active');
                const page = currentlyActiveNav ? currentlyActiveNav.dataset.page : 'manage-profiles';
                await fetchPage(`/settings/${page}`, contentArea, "loading");
            } else if (clickedLink.classList.contains('add-profile-box')) {
                await fetchPage(`/settings/profiles/${ACTIONS.AddProfile}`, contentArea, "loading");
            } else if (clickedLink.classList.contains('profile-box')) {
                const profileId = clickedLink.id;
                await fetchPage(`/settings/profiles/${ACTIONS.EditProfile}?id=${profileId}`, contentArea, "loading");
            }
        }
    });
}

async function addProfileFormSubmitListener() {
    document.addEventListener('click', async (event) => {
        const clickedButton = event.target.closest('button');
        if (!clickedButton) {
            return;
        }
        if (clickedButton.id !== 'add-profile-submit-btn') {
            return;
        }
        event.preventDefault();

        const userId = await getUserIdOrRedirect();
        if (!userId) {
            return;
        }

        const name = document.getElementById('name').value.trim();
        const fileInput = document.getElementById('avatar');
        const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

        // Client-side validation for image file
        if (file) {
        const allowed = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (!allowed.includes(file.type)) {
            showError('Please upload a valid image file (PNG, JPG, JPEG, GIF, WEBP).');
            return;
        }
        if (file.size > maxSize) {
            showError('Image is too large. Max size is 5MB.');
            return;
        }
        }

        try {
            const formData = new FormData();
            
            formData.set('name', name);
            if (file) {
                formData.set('avatar', file);
            }
            
            await apiForm(`/api/users/${encodeURIComponent(userId)}/profiles`, formData);
            const contentArea = document.querySelector('.settings-content-area');
            await fetchPage('/settings/manage-profiles', contentArea, "loading");
            const topbar = document.querySelector('.topbar');
            await fetchPage('/topbar/settings', topbar, "loading");
        } catch (err) {
            showError(err.message);
        }
    });
}

async function deleteProfileListener() {
    document.addEventListener('click', async (event) => {
        const clickedButton = event.target.closest('button');
        if (!clickedButton) {
            return;
        }
        if (clickedButton.id !== 'delete-profile-button') {
            return;
        }
        event.preventDefault();

        const userId = await getUserIdOrRedirect();
        if (!userId) {
            return;
        }

        const profileId = clickedButton.dataset.profileid;
        const activeProfileId = clickedButton.dataset.activeprofileid;
        console.log(`Deleting profile with ID: ${profileId}`);
        if (!profileId) {
            showError(`Profile ID not found. ID: ${profileId}`);
            return;
        }
        
        try {
            await apiRequest(`/api/users/${encodeURIComponent(userId)}/profiles/${encodeURIComponent(profileId)}`, 'DELETE');
            if (profileId === activeProfileId) {
                // If the deleted profile was the active one, go back to profile selection
                location.href = '/profile-selection';
                return;
            }
            const contentArea = document.querySelector('.settings-content-area');
            await fetchPage('/settings/manage-profiles', contentArea, "loading");
            const topbar = document.querySelector('.topbar');
            await fetchPage('/topbar/settings', topbar, "loading");
        } catch (err) {
            showError(err.message);
        }
    });
}

async function updateProfileFormSubmitListener() {
    document.addEventListener('click', async (event) => {
        const clickedButton = event.target.closest('button');
        if (!clickedButton) {
            return;
        }
        if (clickedButton.id !== 'save-profile-changes-button') {
            return;
        }
        event.preventDefault();

        const userId = await getUserIdOrRedirect();
        if (!userId) {
            return;
        }

        const profileId = clickedButton.dataset.profileid;
        const name = document.getElementById('name').value.trim();
        const fileInput = document.getElementById('avatar');
        const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

        // Client-side validation for image file
        if (file) {
            const allowed = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (!allowed.includes(file.type)) {
                showError('Please upload a valid image file (PNG, JPG, JPEG, GIF, WEBP).');
                return;
            }
            if (file.size > maxSize) {
                showError('Image is too large. Max size is 5MB.');
                return;
            }
        }

        try {
            const formData = new FormData();
            
            formData.set('name', name);
            if (file) {
                formData.set('avatar', file);
            }
            
            await apiForm(`/api/users/${encodeURIComponent(userId)}/profiles/${encodeURIComponent(profileId)}`, formData, 'PATCH');
            const contentArea = document.querySelector('.settings-content-area');
            await fetchPage('/settings/manage-profiles', contentArea, "loading");
            const topbar = document.querySelector('.topbar');
            await fetchPage('/topbar/settings', topbar, "loading");
        } catch (err) {
            showError(err.message);
        }
    });
}

async function getUserIdOrRedirect() {
  try {
    const me = await apiRequest('/api/auth/me', 'GET');
    if (me?.user?.id) {
      return me.user.id;
    }
  } catch (e) {
    // Fall through to redirect
  }
  location.href = '/login';
  return null;
}

// Global page scripts are those that do not need to be reinitialized on every page load
function initGlobalPageScripts() {
  settingsPageNavbarPageSwapListener();
  addProfileFormSubmitListener();
  deleteProfileListener();
  updateProfileFormSubmitListener();
}

document.addEventListener('DOMContentLoaded', () => {
    initGlobalPageScripts();
});