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
        const res = await fetch(`/content-main/${page}`);
        if (!res.ok) throw new Error('Failed to load page');

        // Fade out current content
        main.classList.add('loading');
        await new Promise(r => setTimeout(r, 250)); // Wait for fade-out
        
        const html = await res.text();

        // Swap the main content
        main.innerHTML = html;

        // Fade back in
        requestAnimationFrame(() => {
          main.classList.remove('loading');
        });
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

document.addEventListener('DOMContentLoaded', () => {
    logoutEventListener('logout-btn');
    profileDropDownTogglerListener();
    profileSwitchListener();
    sideNavbarPageSwapListener();
});

// TO BE REMOVED ...
const mockData = [
  { title: "Parasite", posterUrl: "/assets/posters/parasite.jpg" },
  { title: "American Psycho", posterUrl: "/assets/posters/psycho.jpg" },
  { title: "The Terminator", posterUrl: "/assets/posters/terminator.jpg" },
  { title: "Snowfall", posterUrl: "/assets/posters/snowfall.jpg" },
];

function renderCards(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = data.map(item => `
    <div class="card">
      <img src="${item.posterUrl}" alt="${item.title}">
      <div class="play-overlay">▶</div>
      <div class="card-title">${item.title}</div>
    </div>
  `).join('');
}

renderCards('continue-watching', mockData);
renderCards('popular', mockData);