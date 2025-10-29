import { apiRequest as api } from '../utils/api-utils.js';

const overlay = document.getElementById('preview-overlay');
const closeBtn = overlay.querySelector('.close-btn');
const main = document.querySelector('.main');

// Populate preview
const posterEl = document.getElementById('preview-poster');
const titleEl = document.getElementById('preview-title');
const yearEl = document.getElementById('preview-year');
const durationEl = document.getElementById('preview-duration');
const ratingEl = document.getElementById('preview-rating')
const descriptionEl = document.getElementById('preview-description');
const genreEl = document.getElementById('preview-genre');
const heartBtnTemplate = document.getElementById('like-btn');
const seasonEpisodeEl = document.getElementById('preview-season-episode');


// Handles playing content from preview
export async function playContent(contentId, lastPositionSec = 0, currentEpisodeId = null) {
  try {
    let redirectUrl = `/player?contentId=${contentId}&lastPositionSec=${lastPositionSec}`;
      if (currentEpisodeId) {
        redirectUrl += `&currentEpisodeId=${currentEpisodeId}`;
      }
      location.href = redirectUrl;
  } catch (e) {
    console.error(`Failed to select content: ${e.message}`);
  }
}


// Fetch user progress for given content
async function getProgress(contentId) {
  try {
    const progress = await api(`/api/history/${contentId}/progress`);
    return progress || null;
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
async function controlButtonsContainer(contentId, heartBtnTemplate, contentType) {
  const progressData = await getProgress(contentId) || {};
  const progress = progressData?.lastPositionSec ?? 0;
  const duration = progressData?.durationSec ?? 0;
  const isLiked = progressData?.liked || false;
  const isCompleted = progressData?.completed || (duration && progress >= duration * 0.95);
  const isSeries = contentType === 'series';
  const currentEpisodeId = progressData?.episodeId ?? 0;

  const actionsContainer = document.getElementById('preview-actions-container');
  actionsContainer.innerHTML = '';

  // ensure no duplicated bars:
  const existingProgress = document.querySelector('.progress-container');
  if (existingProgress) existingProgress.remove();

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
  else {
    likeBtn.classList.remove('liked');
    icon.classList.remove('bi-heart-fill');
    icon.classList.add('bi-heart');
  }

  likeBtn.addEventListener('click', async e => {
    try {
      e.stopPropagation();
      const res = await api(`/api/history/${contentId}/like`, 'POST');
      if (!res?.success) throw new Error('Toggle failed');
      const liked = res.liked;

      if (liked) {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
        likeBtn.classList.add('liked');
      } else {
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
        likeBtn.classList.remove('liked');
      }
    } catch (err) {
      console.error('Failed liking content:', err);
    }
});

  // --- COMPLETED STATE ---
  if (isCompleted) {
    await api(`/api/history/${contentId}/reset-progress`, 'POST');
    const watchAgainBtn = document.createElement('button');
    watchAgainBtn.className = 'watch-again-btn';
    watchAgainBtn.classList.add('control-btn');
    watchAgainBtn.textContent = 'Watch Again';
    watchAgainBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await playContent(contentId, 0); // if series will look for the first episode
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
      if (isSeries) {
        if (progress > 0 && progress < duration)
          await playContent(contentId, progress, currentEpisodeId);
        else
          await playContent(contentId, 0, currentEpisodeId);
      }
      else {
        await playContent(contentId, progress);
      }
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
    const content = await api(`/api/content/${contentId}`);
    if (!content) { const e = new Error('Content not found'); e.status = 404; throw e; }

    let currentEpisodeId = null;
    const progressData = await getProgress(contentId);
    currentEpisodeId = progressData?.episodeId;
    
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

    if (posterEl) posterEl.src = content.posterUrl;
    if (titleEl) titleEl.textContent = content.title;
    if (descriptionEl) descriptionEl.textContent = content.description;
    if (genreEl) genreEl.textContent = content.genres.join(', ');

    if (seasonEpisodeEl) {
      if (content.type === 'series') {
        if (currentEpisodeId) {
          const info = await api(`/api/content/${contentId}/${currentEpisodeId}/season-episode`);
          seasonEpisodeEl.textContent = info 
            ? `Season ${info.seasonNumber} Episode ${info.episodeNumber}`
            : '';
        } else {
          seasonEpisodeEl.textContent = '';
        }
      }
    }

    if (content.type === 'movie') {
      if (yearEl) {
        yearEl.textContent = content.year ? `(${content.year})` : '';
        yearEl.classList.remove('hidden');
      }
      if (durationEl) {
        durationEl.textContent = showDuration(content);
        durationEl.classList.remove('hidden');
      }
    } else if (content.type === 'series') {
      if (yearEl) yearEl.classList.add('hidden');
        if (durationEl) durationEl.classList.add('hidden');
    }

    // Show rating only if available
    if (ratingEl) {
      if (content.ratings?.imdb) {
        ratingEl.textContent = `⭐ IMDB: ${content.ratings.imdb}/10`;
      } else {
        ratingEl.textContent = "No rating available";
      }
    }

  // Actors with clickable Wikipedia links
    const actorsContainer = document.getElementById('preview-actors');
    // Fetch rendered actors list
    let actorsUrl = `/content-main/preview/${contentId}/actors`;
    if (currentEpisodeId) actorsUrl += `?episodeId=${currentEpisodeId}`;
    const res = await fetch(actorsUrl);
    const html = await res.text();
    actorsContainer.innerHTML = html;

    // Control buttons (Play, Continue, Start Over, Like)
    await controlButtonsContainer(contentId, heartBtnTemplate, content.type);


    // Episodes (for series)
    if (content.type === 'series' && Array.isArray(content.episodes)) {
      const episodesContainer = document.getElementById('episodes-container');
      episodesContainer.classList.remove('hidden');

      // Fetch the rendered EJS HTML from your server endpoint
      const res = await fetch(`/content-main/preview/${contentId}/episodes`);
      const html = await res.text();
      episodesContainer.innerHTML = html;

      const toggleEpisodesBtn = episodesContainer.querySelector('#toggle-episodes-btn');
      const episodesList = episodesContainer.querySelector('#episodes-list');

      toggleEpisodesBtn.addEventListener('click', () => {
        const isVisible = !episodesList.classList.contains('hidden');
        episodesList.classList.toggle('hidden', isVisible);
        toggleEpisodesBtn.textContent = isVisible ? 'All Episodes' : 'Hide Episodes';
      });

      // Make each episode card clickable
      const episodeCards = episodesContainer.querySelectorAll('.episode-card');
      episodeCards.forEach(card => {
        card.addEventListener('click', async () => {
          const episodeId = card.dataset.episodeId;
          // Use your existing playContent function
          await playContent(contentId, 0, episodeId); // start from 0 sec
        });
      });
    }
      
    overlay.classList.remove('hidden');
    main.classList.add('blurred');

  } catch (err) {
    console.error('Preview error:', err);
  }
}

  function closePreview() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    main.classList.remove('blurred');

    // Clear basic fields
    if (posterEl) posterEl.src = '';
    if (titleEl) titleEl.textContent = '';
    if (yearEl) yearEl.textContent = '';
    if (descriptionEl) descriptionEl.textContent = '';
    if (genreEl) genreEl.textContent = '';
    if (ratingEl) ratingEl.textContent = '';
    if (durationEl) durationEl.textContent = '';
    if (seasonEpisodeEl) seasonEpisodeEl.textContent = '';

    // Clear episodes section
    const episodesContainer = overlay.querySelector('#episodes-container');
    if (episodesContainer) {
      episodesContainer.innerHTML = ''; // remove any rendered episodes
      episodesContainer.classList.add('hidden'); // hide it again
    }

    // Scroll back to top
    overlay.scrollTop = 0;
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