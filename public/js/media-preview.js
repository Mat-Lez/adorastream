import { apiRequest as api } from '../utils/api-utils.js';

const overlay = document.getElementById('preview-overlay');
const closeBtn = overlay.querySelector('.close-btn');
const main = document.querySelector('.main');


// Handles playing content from preview
export async function playContent(contentId, lastPositionSec = 0) {
  try {
    await api('/api/content/select-content', 'POST', { contentId, lastPositionSec });
    location.href = `/player?contentId=${contentId}&lastPositionSec=${lastPositionSec}`;
  } catch (e) {
    console.error(`Failed to select content: ${e.message}`);
  }
}

 // Fetch user progress for given content
async function getProgress(contentId) {
  try {
    const res = api(`/api/history/progress?contentId=${contentId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching progress:', err);
    return null;
  }
}
// Construct progress bar 
function showProgressBar(container, progressSeconds, durationSeconds) {
  if (!progressSeconds || !durationSeconds) return;

  const percent = Math.min((progressSeconds / durationSeconds) * 100, 100);
  const progressWrapper = document.createElement('div');
  progressWrapper.className = 'progress-container';
  
  // Bar
  const bar = document.createElement('div');
  bar.className = 'progress-wrapper';
  bar.innerHTML = `<div class="progress-bar" style="width: ${percent}%"></div>`;
  
  // Time
  const timeText = document.createElement('span');
  timeText.className = 'progress-time';
  const minutesPast = Math.floor(progressSeconds / 60);
  const totalMinutes = Math.ceil(durationSeconds / 60);
  timeText.textContent = `${minutesPast} / ${totalMinutes} min`;

  progressWrapper.appendChild(bar);
  progressWrapper.appendChild(timeText);
  container.appendChild(progressWrapper);
}

// Construct control buttons container - play / continue / restart / like
async function controlButtonsContainer(contentId, heartBtnTemplate) {
  const progressData = await getProgress(contentId);
  const progress = progressData?.lastPositionSec || 0;
  const duration = progressData?.durationSec || 0;
  const isLiked = progressData?.liked || false;
  const isCompleted = duration && progress >= duration * 0.95;

  const actionsContainer = document.getElementById('preview-actions-container');
  actionsContainer.innerHTML = '';

  const actionsRow = document.createElement('div');
  actionsRow.className = 'actions-row';

  // --- SHOW LIKE BUTTON ANYWAY ---

  // clone like button so each preview has its own
  const likeBtn = heartBtnTemplate.cloneNode(true);
  const icon = likeBtn.querySelector('i');

  // Set initial liked state
  if (isLiked) {
    likeBtn.classList.add('liked');
    icon.classList.remove('bi-heart');
    icon.classList.add('bi-heart-fill');
  }

  likeBtn.addEventListener('click', e => {
    try {
      e.stopPropagation();
      const res =  api(`/api/history/${contentId}/like`, 'POST');
      if (likeBtn.classList.contains('liked')) {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
      } else {
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
      }
    } catch (err) {
      console.error('Failed liking content:', err);
    }
});

  // --- COMPLETED STATE ---
  if (isCompleted) {
    const watchAgainBtn = document.createElement('button');
    watchAgainBtn.className = 'watch-again-btn';
    watchAgainBtn.classList.add('control-btn');
    watchAgainBtn.textContent = 'Watch Again';
    watchAgainBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await playContent(contentId, 0);
    });

    actionsRow.appendChild(watchAgainBtn);
  } 
  // --- IN-PROGRESS OR NOT STARTED ---
  else {
    const playBtn = document.createElement('button');
    playBtn.className = 'play-button';
    playBtn.classList.add('control-btn');
    playBtn.dataset.contentId = contentId;
    playBtn.textContent = (progress > 0 && progress < duration)
      ? 'Continue Watching'
      : 'Play';
    playBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await playContent(contentId);
    });
    actionsRow.appendChild(playBtn);

    if (progress > 0 && progress < duration) {
      const restartBtn = document.createElement('button');
      restartBtn.className = 'start-over-btn';
      restartBtn.classList.add('control-btn');
      restartBtn.textContent = 'Start Over';
      restartBtn.addEventListener('click', async e => {
        e.stopPropagation();
        await playContent(contentId, 0);
      });
      actionsRow.appendChild(restartBtn);

      // --- PROGRESS BAR ---
      if (progress > 0 && duration > 0) {
        showProgressBar(actionsContainer, progress, duration);
      }
    }
  }
    actionsRow.appendChild(likeBtn);
    actionsContainer.appendChild(actionsRow);
  }


async function openPreview(contentId) {
  try {
    // Fetch content info
    const res = await fetch(`/api/content/${contentId}`);
    if (!res.ok) throw new Error('Failed to fetch content');
    const data = await res.json();

    // Format duration helper
    function formatDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (hrs > 0) return `${hrs}h ${remainingMins}m`;
      return `${mins}m`;
    }

    function showDuration(content) {
      let durationText = '';
      if (content.type === 'movie' && content.durationSec) {
        durationText = formatDuration(content.durationSec);
      } else if (content.type === 'series' && Array.isArray(content.episodes) && content.episodes.length > 0) {
        const epDuration = content.episodes[0].durationSec || 0;
        durationText = epDuration ? formatDuration(epDuration) : 'N/A';
      }
      return durationText;
    }

    // Populate preview
    

    // should i add a check to check the elements exist?
    document.getElementById('preview-poster').src = '/static/' + data.posterUrl;
    document.getElementById('preview-title').textContent = data.title;
    document.getElementById('preview-year').textContent = data.year ? `(${data.year})` : '';
    document.getElementById('preview-rating').textContent = 
      data.ratings?.imdb ? `⭐ IMDB: ${data.ratings.imdb}/10` : 'No rating available';
    document.getElementById('preview-description').textContent = data.description;
    document.getElementById('preview-genre').textContent = data.genres.join(', ');
   // document.getElementById('preview-actors').textContent = data.actors.map(actor => actor.name).join(', ');
    document.getElementById('preview-duration').textContent = showDuration(data);
    const heartBtnTemplate = document.getElementById('like-btn');
    // const heartIcon = heartBtnTemplate.querySelector('i');

   // Actors with clickable Wikipedia links
    const actorsContainer = document.getElementById('preview-actors');
    actorsContainer.innerHTML = data.actors.map(actor => {
      const wiki = actor.wikipedia ? actor.wikipedia : `https://en.wikipedia.org/wiki/${encodeURIComponent(actor.name)}`;
      return `<a href="${wiki}" target="_blank">${actor.name}</a>`;
    }).join(', ');

    // Control buttons (Play, Continue, Start Over, Like)
    await controlButtonsContainer(contentId, heartBtnTemplate);

    // Episodes (for series)
    const episodesList = document.getElementById('episodes-list');
    if (data.type === 'series' && Array.isArray(data.episodes)) {
      episodesList.classList.remove('hidden');
      episodesList.innerHTML = data.episodes
        .map(ep => `<div class="episode">${ep.title}</div>`)
        .join('');
    } else {
      episodesList.classList.add('hidden');
      episodesList.innerHTML = '';
    }

    overlay.classList.remove('hidden');
    main.classList.add('blurred');
  } catch (err) {
    console.error('Preview error:', err);
  }
}

  function closePreview() {
  overlay.classList.add('hidden');
  main.classList.remove('blurred');
}

  // Event listeners for closing overlay
  overlay.addEventListener('click', e => {
    if (!e.target.closest('.preview-card')) closePreview();
  });
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    closePreview();
  });

export { openPreview };

// Need to add similar content