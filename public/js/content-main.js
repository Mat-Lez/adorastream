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

async function profileSwitchListener(){
  const pd = document.querySelector('.profile-dropdown');
  if (!pd) return;
  const profileItems = pd.querySelectorAll('.profile-item');
  profileItems.forEach(item => {
    if (item.id === 'manage-profiles-item') {
      // SHOULD ADD LOGIC HERE TO GO TO SETTINGS PAGE
      console.log('Manage profiles clicked but there is no logic yet!');
      return;
    } else {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const profileId = item.id;
        const errMsg = await switchProfile(profileId);
        if (errMsg) {
          console.error('Profile switch failed:', errMsg);
        }
      }); 
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
      try {
        const res = await fetch(`/content-main/${page}`, {
          headers: {
            // added header to indicate ajax request coming from internal fetch
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        if (!res.ok) throw new Error('Failed to load page');

        // Fade out
        await animateOut(main, 'loading');
        
        const html = await res.text();

        // Swap the main content
        main.innerHTML = html;

        initPageScripts(); // Reinitialize event listeners for new content
        // Fade back in
        await animateIn(main, 'loading');
      } catch (err) {
        console.error(err);
        main.innerHTML = `<p class="error">Failed to load page: ${page}</p>`;
      }
    });
  });
}

async function animateOut(element, animationClass, animationDuration = 250) {
  element.classList.add(animationClass);
  await new Promise(resolve => {
    setTimeout(resolve, animationDuration);
  });
}

async function animateIn(element, animationClass, animationDuration = 250) {
  requestAnimationFrame(() => {
    element.classList.remove(animationClass);
  });
  await new Promise(resolve => {
    setTimeout(resolve, animationDuration);
  });
}


// Global page scripts are those that do not need to be reinitialized on every page load
function initGlobalPageScripts() {
  sideNavbarPageSwapListener();
}

function initPageScripts() {
  logoutEventListener('logout-btn');
  profileDropDownTogglerListener();
  profileSwitchListener();
}

// TO BE REMOVED ...
const mockData = [
  { _id: "68fbd22e42639281fc130633", title: "Shironet", posterUrl: "/assets/posters/1761302557127_pr6.jpeg" },
  { _id: "2", title: "American Psycho", posterUrl: "/assets/posters/psycho.jpg" },
  { _id: "3", title: "The Terminator", posterUrl: "/assets/posters/terminator.jpg" },
  { _id: "4", title: "Snowfall", posterUrl: "/assets/posters/snowfall.jpg" },
];

function renderCards(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = data.map(item => `
    <div class="card" data-id="${item._id}">
      <img src="${item.posterUrl}" alt="${item.title}">
      <div class="play-overlay">▶</div>
      <div class="card-title">${item.title}</div>
    </div>
  `).join('');
}

  const overlay = document.getElementById('preview-overlay');
  const closeBtn = overlay.querySelector('.close-btn');
  const main = document.querySelector('.main');

function addCardClickListeners() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach(card => {
    card.addEventListener('click', async (e) => {
      e.target.closest('.card'); // adjust selector to match your card class
      const cardEl = e.target.closest('.card');
      if (!cardEl) return; // click was outside a card
      const contentId = cardEl.dataset.id;

      if (contentId) {
        // Show overlay
        openPreview(contentId);
      }
  });
});
}

// Close button
document.addEventListener('click', e => {
  if (e.target.classList.contains('close-btn') || e.target.id === 'preview-overlay') {
    document.getElementById('preview-overlay').classList.add('hidden');
  }
});


document.addEventListener('DOMContentLoaded', () => {
    logoutEventListener('logout-btn'),
    profileDropDownTogglerListener(),
    profileSwitchListener(),
    renderCards('continue-watching', mockData),
    renderCards('popular', mockData),
    addCardClickListeners()
});