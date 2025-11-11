import { apiRequest as api } from '/utils/api-utils.js';
import { logoutEventListener } from '../utils/reuseableEventListeners.js';
import { switchProfile } from '/utils/profilesManagement.js';
import { fetchPage } from '../utils/pageManagement.js';
import { animateOut } from "../utils/reuseableAnimations.js";


// init functions
(async () => {
    // Check if the user is authenticated
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) {
    location.href = '/login'
    return;
    }

    const session = await res.json();
    if (!session?.user?.profileId) {
      location.href = '/profile-selection';
      return;
    }
})();

function handleProfileMenuToggle(profileDropdown, profileBtn, profileMenu) {
    const isOpen = profileDropdown.classList.toggle('open');
    profileBtn.setAttribute('aria-expanded', String(isOpen));
    profileMenu.setAttribute('aria-hidden', String(!isOpen));
}

async function handleProfileSwitch(clickedProfileItem, main) {
    const profileId = clickedProfileItem.id;
    await animateOut(main, 'loading');
    main.classList.remove('loading');
    const errMsg = await switchProfile(profileId);
    if (errMsg) {
        console.error('Profile switch failed:', errMsg);
        main.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = `Profile switch failed: ${errMsg}`;
        main.appendChild(p);
    }
}

async function handleManageProfilesClick(main) {
    // This logic simulates a click on the "Settings" nav button
    const settingsBtn = document.querySelector('.nav-item[data-page="settings"]');
    if (settingsBtn) {
        settingsBtn.click();
    } else {
        // Fallback if settings button isn't found
        await fetchPage(`/content-main/settings`, main, "loading");
    }
}

function handleCloseProfileMenu(profileDropdown, profileBtn, profileMenu) {
    if (profileMenu?.contains(document.activeElement)) {
        document.activeElement.blur();
    }
    profileDropdown.classList.remove('open');
    profileBtn?.setAttribute('aria-expanded', 'false');
    profileMenu?.setAttribute('aria-hidden', 'true');
}

/**
  * Listens for clicks related to the profile dropdown in the topbar
  * This uses event listener on the body object in order to always capture clicks
  * even if the dropdown is re-rendered.
 */
function topbarProfilesDropdownActionsListener() {
  document.body.addEventListener('click', async (e) => {
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (!profileDropdown) return;

    const profileBtn = profileDropdown.querySelector('#profile-btn');
    const profileMenu = profileDropdown.querySelector('.profiles-menu');
    const main = document.querySelector('.main');

    // User clicked the main profile button to toggle the menu
    if (profileBtn?.contains(e.target)) {
      e.preventDefault();
      handleProfileMenuToggle(profileDropdown, profileBtn, profileMenu);
      return;
    }

    const clickedProfileItem = e.target.closest('.profile-item');

    // User clicked on a profile item
    if (clickedProfileItem) {
      e.preventDefault();
      if (clickedProfileItem.id === 'manage-profiles-item') {
        // User clicked "Manage Profiles"
        await handleManageProfilesClick(main);
      } else {
        // User clicked on a profile item to switch
        await handleProfileSwitch(clickedProfileItem, main);
      }
      return;
    }

    // User clicked *outside* the dropdown
    if (!profileDropdown.contains(e.target) && profileDropdown.classList.contains('open')) {
      handleCloseProfileMenu(profileDropdown, profileBtn, profileMenu);
    }
  });
}

async function sideNavbarPageSwapListener() {
  const navButtons = document.querySelectorAll('.nav-item');
  const main = document.querySelector('.main');

  navButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      // Highlight active button
      navButtons.forEach(b => {
        b.classList.remove('active')
        b.disabled = false;
      });
      btn.classList.add('active');
      btn.disabled = true; // disable button so it will not be infinitly clickable and rerun the fade animation

      const page = btn.dataset.page;
      let pageUrl = `/content-main/${page}`;
      if (page === 'settings' && btn.dataset.settingsTarget) {
        pageUrl += `?tab=${btn.dataset.settingsTarget}`;
      }

      await fetchPage(pageUrl, main, "loading");

    });
  });
}


function addCardClickListeners() {
  document.body.addEventListener('click', async (e) => {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;
    const contentId = cardEl.dataset.id;
    if (!contentId) return;
    try {
      await api('/api/content/select-content', 'POST', { contentId });
      location.href = '/player';
    } catch (err) {
      console.error(`Failed to select content: ${err.message}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  sideNavbarPageSwapListener();
  topbarProfilesDropdownActionsListener();
  logoutEventListener('logout-btn');
  addCardClickListeners();
});
