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

function profileDropDownTogglerListener(){
  const pd = document.querySelector('.profile-dropdown');
  if (!pd) return;
  const btn = pd.querySelector('#profile-btn');
  const menu = pd.querySelector('.profiles-menu');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const isOpen = pd.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
  });

  // close when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!pd.contains(e.target)) {
      if (menu.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      pd.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
  });
}

async function profileSwitchListener(){
  const pd = document.querySelector('.profile-dropdown');
  if (!pd) return;
  const main = document.querySelector('.main');
  const profileItems = pd.querySelectorAll('.profile-item');
  profileItems.forEach(item => {
    if (item.id === 'manage-profiles-item') {
      const manageBtn = item.querySelector('#manage-profiles-btn');
      if (!manageBtn) return;
      manageBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // Close dropdown
        pd.classList.remove('open');
        const toggleBtn = pd.querySelector('#profile-btn');
        const menu = pd.querySelector('.profiles-menu');
        if (toggleBtn && menu) {
          toggleBtn.setAttribute('aria-expanded', 'false');
          menu.setAttribute('aria-hidden', 'true');
        }

        const navButtons = document.querySelectorAll('.nav-item');
        const settingsBtn = Array.from(navButtons).find(btn => btn.dataset.page === 'settings' && !btn.dataset.settingsTarget);

        if (settingsBtn) {
          navButtons.forEach(b => {
            b.classList.remove('active');
            b.disabled = false;
          });
          settingsBtn.classList.add('active');
          settingsBtn.disabled = true;
        }

        await fetchPage('/content-main/settings?tab=manage-profiles', main, "loading");
        initPageScripts();
      });
    } else {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const profileId = item.id;
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
      let pageUrl = `/content-main/${page}`;
      if (page === 'settings' && btn.dataset.settingsTarget) {
        pageUrl += `?tab=${btn.dataset.settingsTarget}`;
      }

      await fetchPage(pageUrl, main, "loading");
      initPageScripts();

    });
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

function addCardClickListeners() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', async (e) => {
      e.target.closest('.card'); // adjust selector to match your card class
      const cardEl = e.target.closest('.card');
      if (!cardEl) return; // click was outside a card
      const contentId = cardEl.dataset.id;
      if (!contentId) return;
      try {
        // Call API to select content to be played
        await api('/api/content/select-content', 'POST', { contentId: contentId });
        location.href = '/player';
      } catch (e) {
          console.error(`Failed to select content: ${e.message}`);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initGlobalPageScripts();
  initPageScripts();
  renderCards('continue-watching', mockData);
  renderCards('popular', mockData);
  addCardClickListeners();
});