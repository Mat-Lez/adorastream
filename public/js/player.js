document.addEventListener('DOMContentLoaded', () => {
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

  // --- global variables ---
  let hideControlsTimeout;

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
    controls.classList.remove('hide');
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => controls.classList.add('hide'), 2500);
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
});
