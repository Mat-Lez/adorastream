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

        // Execute any scripts included in the fetched HTML (inline or external)
        // Browsers don't run scripts inserted via innerHTML, so we recreate them.
        (function runInsertedScripts(root) {
          const scripts = Array.from(root.querySelectorAll('script'));
          scripts.forEach(s => {
            try {
              const newScript = document.createElement('script');
              // copy attributes
              for (let i = 0; i < s.attributes.length; i++) {
                const a = s.attributes[i];
                newScript.setAttribute(a.name, a.value);
              }
              if (s.src) {
                // external script - set src and append to body to load
                newScript.src = s.src;
                newScript.async = false; // preserve execution order
                document.body.appendChild(newScript);
              } else {
                // inline script: copy textContent
                newScript.textContent = s.textContent;
                document.body.appendChild(newScript);
              }
            } catch (e) { console.warn('Failed to run inserted script', e); }
          });
        })(main);

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
  // Delegate filter toggle clicks to ensure the mobile filters toggle works even
  // when the topbar partial was injected dynamically or its inline script didn't run.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#filters-toggle');
    if (!btn) return;
    const panel = document.getElementById('filters-panel');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    e.stopPropagation();
  });

  // Expose a global function so inline onclicks or other code can toggle filters reliably
  window.toggleFilters = function toggleFilters() {
    const btn = document.getElementById('filters-toggle');
    const panel = document.getElementById('filters-panel');
    if (!btn || !panel) return;
    const open = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
  };

  // Close panel on Escape for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('filters-panel');
      const btn = document.getElementById('filters-toggle');
      if (panel && panel.classList.contains('open')) {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Try to attach direct handler if the button exists now
  attachFiltersToggleIfPresent();
}

function attachFiltersToggleIfPresent(){
  try{
    const btn = document.getElementById('filters-toggle');
    if (!btn || btn.__filtersAttached) return;
    const handler = (e)=>{
      const panel = document.getElementById('filters-panel');
      if (!panel) return;
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      e.stopPropagation();
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchstart', handler);
    btn.__filtersAttached = true;
  }catch(e){console.warn('attachFiltersToggleIfPresent failed', e)}
}

// Observe DOM for when the topbar search partial is injected so we can attach the handler
const topbarObserver = new MutationObserver((mutations)=>{
  for(const m of mutations){
    if(m.addedNodes){
      for(const n of m.addedNodes){
        if(n.nodeType===1 && n.querySelector && n.querySelector('#filters-toggle')){
          attachFiltersToggleIfPresent();
          return;
        }
      }
    }
  }
});
topbarObserver.observe(document.body, { childList: true, subtree: true });

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