import { apiRequest as api } from '/utils/api-utils.js';
import { logoutEventListener } from '../utils/reuseableEventListeners.js';
import { switchProfile } from '/utils/profilesManagement.js';


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
      // SHOULD ADD LOGIC HERE TO GO TO SETTINGS PAGE
      console.log('Manage profiles clicked but there is no logic yet!');
      return;
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
        main.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = `Failed to load page: ${page}`;
        main.appendChild(p);
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