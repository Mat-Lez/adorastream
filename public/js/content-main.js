import { logoutEventListener } from './utils/reuseableEventListeners.js';

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

document.addEventListener('DOMContentLoaded', 
    logoutEventListener('logout-btn'),
);

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