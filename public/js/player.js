import { apiRequest as api } from '../utils/api-utils.js';

document.addEventListener('DOMContentLoaded', async () => {

  const video = document.getElementById('video-player');
  const controls = document.getElementById('custom-controls');
  const playPause = document.getElementById('play-pause');
  const forwardBtn = document.getElementById('forward');
  const backwardBtn = document.getElementById('backward');
  const fullscreenBtn = document.getElementById('fullscreen');
  const muteBtn = document.getElementById('mute-toggle');
  const skipOverlay = document.getElementById('skip-overlay');
  const volumeSlider = document.getElementById('volume-slider');
  const timeDisplay = document.getElementById('time-display');
  const wrapper = document.querySelector('.video-wrapper');
  const timeline = document.getElementById('timeline');

  if (!video) return console.error('video element not found'); 
  const lastPosition = parseFloat(video.dataset.lastPosition || 0);

  // --- global variables ---
  let hideControlsTimeout;
  let carouselTimeout; 

  // --- get currently played ---
  let contentId, currentEpisodeId, type;
  try {
    const result = await api('/api/content/currently-played');
    contentId = result.contentId;
    currentEpisodeId = result.currentEpisodeId;
    type = result.type;
  } catch (err) {
    console.error('Failed to fetch content info:', err);
  }

    // --- Initialize series if applicable ---
  if (type === 'series') {
    initSeries();
  }
  let lastSavedTime = 0;
  const SAVE_INTERVAL = 10; // seconds
  let saveTimer;

  // --- Utility functions ---
  function showSkipOverlay(text) {
    skipOverlay.textContent = text;
    skipOverlay.classList.add('show');
    clearTimeout(skipOverlay.hideTimeout);
    skipOverlay.hideTimeout = setTimeout(() => skipOverlay.classList.remove('show'), 500);
  }

  function togglePlay() {
    const icon = playPause.querySelector('i');
    if (video.paused) {
      video.play();
      if (icon) icon.className = 'bi bi-pause-fill';
    } else {
      video.pause();
      if (icon) icon.className = 'bi bi-play-fill';
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  function showControls() {
    controls.classList.remove('hide-controls');
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => controls.classList.add('hide-controls'), 2500);
  }

  // --- Event listeners ---
  document.addEventListener('mousemove', showControls);
  document.addEventListener('touchstart', showControls, { passive: true });

  playPause.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    togglePlay();
  });

  video.addEventListener('click', togglePlay);

  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      video.currentTime = Math.min(video.currentTime + 10, video.duration || Infinity);
      showSkipOverlay('+10s');
    });
  }

  if (backwardBtn) {
    backwardBtn.addEventListener('click', () => {
      video.currentTime = Math.max(video.currentTime - 10, 0);
      showSkipOverlay('-10s');
    });
  }

  video.addEventListener('timeupdate', () => {
    if (timeline && video.duration) {
      timeline.value = (video.currentTime / video.duration) * 100 || 0;
      timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }
    if (video.currentTime - lastSavedTime >= SAVE_INTERVAL) {
      saveProgress();
    }
  });

  video.addEventListener('seeked', () => {
    // If user jumps backward, reset lastSavedTime
    if (video.currentTime < lastSavedTime) {
      lastSavedTime = video.currentTime;
    }
  });

  // when the video finishes, time updates no longet fire
  video.addEventListener('ended', () => {
    lastSavedTime = 0; // reset for rewatch

  });

  if (timeline) {
    timeline.addEventListener('input', () => {
      timeline.dragging = true;
      video.currentTime = (timeline.value / 100) * video.duration;
    });
    timeline.addEventListener('change', () => {
      timeline.dragging = false;
    });
  }

  // --- Mute / Unmute ---
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const icon = muteBtn.querySelector('i');
      video.muted = !video.muted;
      if (video.muted) {
        if (icon) icon.className = 'bi bi-volume-mute-fill';
        if (volumeSlider) volumeSlider.value = 0;
      } else {
        if (icon) icon.className = 'bi bi-volume-down-fill';
        if (volumeSlider) volumeSlider.value = video.volume;
      }
    });
  }

  // --- Fullscreen toggle ---
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(err => console.warn('Fullscreen failed:', err));
      } else {
        document.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      video.volume = volumeSlider.value;
      const icon = muteBtn.querySelector('i');
      if (icon) icon.className = video.volume === 0 ? 'bi bi-volume-mute-fill' : 'bi bi-volume-down-fill';
    });
  }

  const backBtn = document.getElementById('back-button');
  if (backBtn) {
    backBtn.addEventListener('click', () => window.location.href = '/content-main');
  }

  function initSeries() {
    const showEpisodesBtn = document.getElementById('show-episodes');
    const nextEpisodeBtn = document.getElementById('next-episode');
    const carouselContainer = document.getElementById('episode-carousel-container');

    const showCarousel = () => {
      clearTimeout(carouselTimeout);
      carouselContainer.classList.remove('hidden');
    };

    const hideCarousel = () => {
      carouselTimeout = setTimeout(() => carouselContainer.classList.add('hidden'), 300);
    };

    carouselContainer.addEventListener('mouseenter', showCarousel);
    carouselContainer.addEventListener('mouseleave', hideCarousel);

    nextEpisodeBtn?.addEventListener('click', async () => {
      try {
        const { contentId, nextEpisodeId } = await api('/api/content/next-episode');
        if (!contentId) return;
        if (!nextEpisodeId) return;
          location.href = `/player?contentId=${contentId}&currentEpisodeId=${nextEpisodeId}`;
      } catch (e) {
          console.error(`Failed to select content: ${e.message}`);
      }
    });

    showEpisodesBtn?.addEventListener('click', async () => {
      if (!carouselContainer) return;
      const carousel = carouselContainer.querySelector('.carousel');
      if (!carousel) return;

      const res = await fetch(`/api/content/${contentId}/episodes`);
      const data = await res.json();

      carousel.innerHTML = '';
      data.episodes.forEach(ep => {
        const card = document.createElement('div');
        card.className = 'episode-card';
        card.innerHTML = `
          <div class="poster-wrapper">
            <img src="${ep.posterUrl}" alt="${ep.title}">
          </div>
          <div class="episode-title" data-episode-id="${ep._id}">
            S${ep.seasonNumber}E${ep.episodeNumber}
          </div>
        `;
        card.addEventListener('click', () => {
          try { 
            location.href = `/player?contentId=${contentId}&currentEpisodeId=${ep._id}`;
          } catch (e) {
            console.error(`Failed to select episode: ${e.message}`);
          }
        });
        carousel.appendChild(card);
      });
      carouselContainer.classList.remove('hidden');

      document.getElementById('carousel-prev')?.addEventListener('click', () => {
        carousel.scrollBy({ left: -200, behavior: 'smooth' });
      });
      document.getElementById('carousel-next')?.addEventListener('click', () => {
        carousel.scrollBy({ left: 200, behavior: 'smooth' });
      });
    });
  }
async function saveProgress() {
  const { contentId, currentEpisodeId } = await api('/api/content/currently-played');

  try {
    await api(`/api/history/${contentId}/progress`, 'POST', {
      positionSec: Math.floor(video.currentTime),
      completed: video.currentTime >= video.duration - 5,
      episodeId: currentEpisodeId
    });

    lastSavedTime = video.currentTime;
  } catch (err) {
    console.error('Failed to save progress:', err);
  }
}

<<<<<<< HEAD
// also save on pause or before leaving the page
video.addEventListener('pause', saveProgress);
video.addEventListener('seeked', saveProgress);
window.addEventListener('beforeunload', saveProgress);
=======
  // also save on pause or before leaving the page
  video.addEventListener('pause', saveProgress);
  video.addEventListener('seeked', saveProgress);
  window.addEventListener('beforeunload', saveProgress);
>>>>>>> 1ad04cb (fix issues in media preview and player)


// When metadata is loaded - duration and etc are known

  video.addEventListener('loadedmetadata', () => {
    if (lastPosition > 0 && lastPosition < video.duration) {
      video.currentTime = lastPosition; // resume from saved time
    }
    video.play().catch(err => {
      console.warn('Autoplay failed (maybe browser restriction):', err);
    });
  });

  if (video.readyState >= 1) {
    video.dispatchEvent(new Event('loadedmetadata'));
  }

});
