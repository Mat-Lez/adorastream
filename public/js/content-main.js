import { apiRequest as api } from '/utils/api-utils.js';
import { logoutEventListener } from '../utils/reuseableEventListeners.js';
import { switchProfile } from '/utils/profilesManagement.js';
import { fetchPage } from '../utils/pageManagement.js';
import { animateOut } from "../utils/reuseableAnimations.js";

const SEARCH_RESULTS_LIMIT = 50;


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
      if (document.getElementById('search')) {
        initSearchFeature();
      }
      if (btn.dataset.settingsTarget === 'statistics') {
          try {
              // Dynamically import the script
              const { initStatisticsCharts } = await import('/js/statistics.js');
              // Run the function that draws the charts
              initStatisticsCharts();
          } catch (err) {
              console.error("Failed to load statistics scripts:", err);
              main.innerHTML = `<p class="error">Failed to load statistics module.</p>`;
          }
      }

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

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCardMarkup(item = {}) {
  const id = item.id || item._id || '';
  const title = escapeHtml(item.title || 'Untitled');
  const posterUrl = item.posterUrl || '/adorastream.png';
  return `
    <div class="card" data-id="${id}">
      <div class="card-media">
        <img src="${posterUrl}" alt="${title}">
        <div class="play-overlay">▶</div>
      </div>
      <div class="card-title">${title}</div>

    </div>
  `;
}

function initSearchFeature() {
  const searchInput = document.getElementById('search');
  const searchSection = document.getElementById('search-results-section');
  const searchGrid = document.getElementById('search-results-grid');
  const searchEmpty = document.getElementById('search-results-empty');
  const mainEl = document.querySelector('.main');
  
  if (searchInput?.dataset.searchInit === 'true') {
    return;
  }

  if (!searchInput || !searchSection || !searchGrid || !searchEmpty || !mainEl) {
    console.error('Search feature could not be initialized: one or more required DOM elements are missing.');
    return;
  }

  const normalizedSearchScope = (searchSection.dataset.scope || 'all').toLowerCase();

  let timerId;

  const setSearchActive = (active) => {
    mainEl.classList.toggle('search-active', active);
    searchSection.classList.toggle('is-hidden', !active);
  };

  const clearResults = () => {
    searchGrid.innerHTML = '';
    searchEmpty.classList.add('is-hidden');
  };

  const showMessage = (message) => {
    searchEmpty.textContent = message;
    searchEmpty.classList.remove('is-hidden');
  };

  const resetSearch = () => {
    clearTimeout(timerId);
    searchInput.value = '';
    setSearchActive(false);
    clearResults();
  };

  const performSearch = async (term) => {
    if (!term) {
      resetSearch();
      return;
    }

    setSearchActive(true);
    showMessage(`Searching for "${term}"…`);
    searchGrid.innerHTML = '';

    try {
      const typeFilterParam = normalizedSearchScope !== 'all'
        ? `&type=${encodeURIComponent(normalizedSearchScope)}`
        : '';
      const response = await api(`/api/content?q=${encodeURIComponent(term)}&limit=${SEARCH_RESULTS_LIMIT}${typeFilterParam}`);
      const contents = response.contents || [];
      if (contents.length === 0) {
        showMessage(`No results found for "${term}".`);
        return;
      }
    searchGrid.innerHTML = contents.map(buildCardMarkup).join('');
      searchEmpty.classList.add('is-hidden');
    } catch (error) {
      showMessage('Search failed. Please try again.');
      console.error('Search error:', error);
    }
  };

  const handleInput = () => {
    const term = searchInput.value.trim();
    clearTimeout(timerId);
    if (!term) {
      setSearchActive(false);
      clearResults();
      return;
    }
    timerId = setTimeout(() => performSearch(term), 300);
  };

  searchInput.addEventListener('input', handleInput);

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      clearTimeout(timerId);
      performSearch(searchInput.value.trim());
    } else if (event.key === 'Escape') {
      resetSearch();
    }
  });
  resetSearch(); // ensure initial state
  searchInput.dataset.searchInit = 'true';
}

document.addEventListener('DOMContentLoaded', () => {
  sideNavbarPageSwapListener();
  topbarProfilesDropdownActionsListener();
  logoutEventListener('logout-btn');
  addCardClickListeners();
  if (document.getElementById('search')) {
    initSearchFeature();
  }
});
