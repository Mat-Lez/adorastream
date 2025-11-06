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

document.addEventListener('DOMContentLoaded', () => {
  initGlobalPageScripts();
  initPageScripts();
});
=======
>>>>>>> 79de7c6 (fix a few duplicacies and logic (Gemini review))

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

<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', 
    logoutEventListener('logout-btn'),
    profileDropDownTogglerListener(),
    profileSwitchListener(),
    sideNavbarPageSwapListener(),
);
=======
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

document.addEventListener('DOMContentLoaded', () => {
  initGlobalPageScripts();
  initPageScripts();
});
>>>>>>> 48136dc (fx: reinitialize event listeners on page swap, add no cache to ensure a client will no go back to content main after logout, added middleware to check that requests to /content-main/page are allowed internally only)

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

document.addEventListener('DOMContentLoaded', () => {
  initGlobalPageScripts();
  initPageScripts();
});

// TO BE REMOVED ...
const mockData = [
<<<<<<< HEAD
  { _id: "68fbd22e42639281fc130633", title: "Shironet", posterUrl: "static/posters/1761302557127_pr6.jpeg" },
=======
  { _id: "690c7f90ed9e892ebb83f89c", title: "Shironet", posterUrl: "/assets/posters/1762426768359_shironet-1.jpg" },
>>>>>>> 85d6bdb40141b25bded5dd6ec0ca8fa6158683a9
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
<<<<<<< HEAD
      const cardEl = e.target.closest('.card'); // adjust selector to match your card class
=======
      const cardEl = e.target.closest('.card');
>>>>>>> 85d6bdb40141b25bded5dd6ec0ca8fa6158683a9
      if (!cardEl) return; // click was outside a card
      const contentId = cardEl.dataset.id;
      if (!contentId) return;
      try {
<<<<<<< HEAD
        // Call API to select profile (store the profileId in session)
        await api('/api/content/select-content', 'POST', { contentId: contentId });
        location.href = '/player';
      } catch (e) {
          console.error(`Failed to select content: ${e.message}`);
=======
        // Call API to select content and move to player page
        await api('/api/content/select-content', 'POST', { contentId: contentId });
        location.href = '/player';
      } catch (e) {
<<<<<<< HEAD
<<<<<<< HEAD
          console.error(`Failed to select content: ${e.message}`);
=======
          return e.message;
>>>>>>> 698908f (Add player page with all required button and functionality.)
=======
          console.error(`Failed to select content: ${e.message}`);
>>>>>>> e977bed (fix a few duplicacies and logic (Gemini review))
>>>>>>> 85d6bdb40141b25bded5dd6ec0ca8fa6158683a9
      }
    });
  });
}

<<<<<<< HEAD
=======
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> e977bed (fix a few duplicacies and logic (Gemini review))
>>>>>>> 85d6bdb40141b25bded5dd6ec0ca8fa6158683a9
document.addEventListener('DOMContentLoaded', 
    logoutEventListener('logout-btn'),
    profileDropDownTogglerListener(),
    profileSwitchListener(),
    renderCards('continue-watching', mockData),
    renderCards('popular', mockData),
    addCardClickListeners()
<<<<<<< HEAD
);
=======
<<<<<<< HEAD
);
=======
renderCards('continue-watching', mockData);
renderCards('popular', mockData);
document.addEventListener('DOMContentLoaded', addCardClickListeners);
>>>>>>> 698908f (Add player page with all required button and functionality.)
=======
);
>>>>>>> e977bed (fix a few duplicacies and logic (Gemini review))
=======
document.addEventListener('DOMContentLoaded', () => {
  initGlobalPageScripts();
  initPageScripts();
  renderCards('continue-watching', mockData);
  renderCards('popular', mockData);
  addCardClickListeners();
<<<<<<< HEAD
});
=======
}
);
>>>>>>> 3827073 (both select content and get functions in content controller and require profile selection for playing media)
>>>>>>> d316bc6 (both select content and get functions in content controller and require profile selection for playing media)
>>>>>>> 85d6bdb40141b25bded5dd6ec0ca8fa6158683a9
