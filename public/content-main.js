(async () => {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return location.href = '/login';
})();

const mockData = [
  { title: "Parasite", posterUrl: "/public/posters/parasite.jpg" },
  { title: "American Psycho", posterUrl: "/public/posters/psycho.jpg" },
  { title: "The Terminator", posterUrl: "/public/posters/terminator.jpg" },
  { title: "Snowfall", posterUrl: "/public/posters/snowfall.jpg" },
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