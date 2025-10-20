/**
 * Add Content page functionality
 */

// Import utility functions
import { apiForm, showSuccess, showError, clearMessage } from '/utils/api-utils.js';

// Actor management
let actorCount = 0;

// Episode management
let episodeCount = 0;
let episodeActorCounts = {}; // Track actor count per episode

/**
 * Add a new actor input field
 */
function addActor() {
  actorCount++;
  const actorsContainer = document.getElementById('actors-container');
  
  const actorDiv = document.createElement('div');
  actorDiv.className = 'actor-field';
  actorDiv.innerHTML = `
    <div class="field-row">
      <div class="field">
        <label class="label">Actor Name</label>
        <input name="actorName_${actorCount}" class="input" type="text" placeholder="e.g., Tom Hardy" required />
      </div>
      <div class="field">
        <label class="label">Role</label>
        <input name="actorRole_${actorCount}" class="input" type="text" placeholder="e.g., Bane" required />
      </div>
      <button type="button" class="btn btn-danger" data-action="remove-actor">Remove</button>
    </div>
  `;
  
  actorsContainer.appendChild(actorDiv);
}

/**
 * Remove an actor input field
 * @param {HTMLElement} button - The remove button that was clicked
 */
function handleActorsContainerClick(e) {
  const target = e.target;
  if (target && target.matches('button[data-action="remove-actor"]')) {
    const wrapper = target.closest('.actor-field');
    if (wrapper) wrapper.remove();
  }
}

/**
 * Toggle content type fields (movie vs series)
 */
function toggleContentFields() {
  const contentType = document.getElementById('content-type').value;
  const movieFields = document.getElementById('movie-fields');
  const seriesFields = document.getElementById('series-fields');
  
  if (contentType === 'movie') {
    movieFields.style.display = 'block';
    seriesFields.style.display = 'none';
  } else if (contentType === 'series') {
    movieFields.style.display = 'none';
    seriesFields.style.display = 'block';
  }
}

// Make toggleContentFields globally accessible
window.toggleContentFields = toggleContentFields;

/**
 * Add a new episode input field
 */
function addEpisode() {
  episodeCount++;
  const episodesContainer = document.getElementById('episodes-container');
  
  // Get current episode count for display (not the global counter)
  const currentEpisodeNumber = episodesContainer.children.length + 1;
  
  const episodeDiv = document.createElement('div');
  episodeDiv.className = 'episode-field';
  episodeDiv.innerHTML = `
    <div class="episode-header">
      <h4>Episode ${currentEpisodeNumber}</h4>
      <button type="button" class="btn btn-danger" data-action="remove-episode">Remove</button>
    </div>
    <div class="field-row">
      <div class="field">
        <label class="label">Episode Title</label>
        <input name="episodeTitle_${episodeCount}" class="input" type="text" placeholder="Episode title" required />
      </div>
      <div class="field">
        <label class="label">Year</label>
        <input name="episodeYear_${episodeCount}" class="input" type="number" placeholder="Year" required />
      </div>
      <div class="field">
        <label class="label">Season Number</label>
        <input name="episodeSeason_${episodeCount}" class="input" type="number" min="1" placeholder="1" required />
      </div>
      <div class="field">
        <label class="label">Episode Number</label>
        <input name="episodeNumber_${episodeCount}" class="input" type="number" min="1" placeholder="1" required />
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label class="label">Director</label>
        <input name="episodeDirector_${episodeCount}" class="input" type="text" placeholder="Episode director" required />
      </div>
      <div class="field">
        <label class="label">Duration (seconds)</label>
        <input name="episodeDuration_${episodeCount}" class="input" type="number" min="0" placeholder="3600" />
      </div>
    </div>
    <div class="field">
      <label class="label">Actors</label>
      <div class="episode-actors-container" id="episode-actors-${episodeCount}">
        <!-- Episode actor fields will be added here dynamically -->
      </div>
      <button type="button" class="btn btn-secondary episode-add-actor" data-episode="${episodeCount}" style="margin-top: 10px;">Add Actor</button>
    </div>
    <div class="field-row">
      <div class="field">
        <label class="label">Video File (MP4)</label>
        <input name="episodeVideo_${episodeCount}" class="input" type="file" accept="video/mp4" />
      </div>
      <div class="field">
        <label class="label">Poster Image</label>
        <input name="episodePoster_${episodeCount}" class="input" type="file" accept="image/*" />
      </div>
    </div>
    <div class="field">
      <label class="label">Episode Description</label>
      <textarea name="episodeDescription_${episodeCount}" class="input" placeholder="Episode description"></textarea>
    </div>
  `;
  
  episodesContainer.appendChild(episodeDiv);
}

/**
 * Add actor to specific episode
 */
function addEpisodeActor(episodeNum) {
  if (!episodeActorCounts[episodeNum]) {
    episodeActorCounts[episodeNum] = 0;
  }
  episodeActorCounts[episodeNum]++;
  
  const container = document.getElementById(`episode-actors-${episodeNum}`);
  
  const actorDiv = document.createElement('div');
  actorDiv.className = 'actor-field';
  actorDiv.innerHTML = `
    <div class="field-row">
      <div class="field">
        <label class="label">Actor Name</label>
        <input name="episodeActorName_${episodeNum}_${episodeActorCounts[episodeNum]}" class="input" type="text" placeholder="e.g., Tom Hardy" required />
      </div>
      <div class="field">
        <label class="label">Role</label>
        <input name="episodeActorRole_${episodeNum}_${episodeActorCounts[episodeNum]}" class="input" type="text" placeholder="e.g., Bane" required />
      </div>
      <button type="button" class="btn btn-danger" data-action="remove-episode-actor">Remove</button>
    </div>
  `;
  
  container.appendChild(actorDiv);
}

/**
 * Renumber episode headers after removal
 */
function renumberEpisodes() {
  const episodesContainer = document.getElementById('episodes-container');
  const episodeFields = episodesContainer.querySelectorAll('.episode-field');
  
  episodeFields.forEach((field, index) => {
    const header = field.querySelector('.episode-header h4');
    if (header) {
      header.textContent = `Episode ${index + 1}`;
    }
  });
}

/**
 * Handle episodes container click events
 */
function handleEpisodesContainerClick(e) {
  const target = e.target;
  if (target && target.matches('button[data-action="remove-episode"]')) {
    const wrapper = target.closest('.episode-field');
    if (wrapper) {
      const episodeNum = wrapper.querySelector('input[name^="episodeTitle_"]').name.match(/_(\d+)$/)[1];
      delete episodeActorCounts[episodeNum];
      wrapper.remove();
      // Renumber remaining episodes
      renumberEpisodes();
    }
  } else if (target && target.matches('button[data-action="remove-episode-actor"]')) {
    const wrapper = target.closest('.actor-field');
    if (wrapper) wrapper.remove();
  } else if (target && target.matches('button.episode-add-actor')) {
    const episodeNum = target.getAttribute('data-episode');
    addEpisodeActor(episodeNum);
  }
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  clearMessage();
  
  const form = e.target;
  const formData = new FormData(form);
  
  // Process actors
  const actors = [];
  const actorFields = document.querySelectorAll('.actor-field');
  
  actorFields.forEach(field => {
    const nameInput = field.querySelector('input[name^="actorName_"]');
    const roleInput = field.querySelector('input[name^="actorRole_"]');
    
    if (nameInput && roleInput && nameInput.value.trim() && roleInput.value.trim()) {
      actors.push({
        name: nameInput.value.trim(),
        role: roleInput.value.trim()
      });
    }
  });
  
  // Add actors to form data
  formData.set('actors', JSON.stringify(actors));
  
  // Remove individual actor fields from form data
  const actorInputs = form.querySelectorAll('input[name^="actorName_"], input[name^="actorRole_"]');
  actorInputs.forEach(input => formData.delete(input.name));

  // Process episodes for series
  const contentType = document.getElementById('content-type').value;
  if (contentType === 'series') {
    const episodes = [];
    const episodeFields = document.querySelectorAll('.episode-field');
    
    episodeFields.forEach((field, index) => {
      const titleInput = field.querySelector('input[name^="episodeTitle_"]');
      const yearInput = field.querySelector('input[name^="episodeYear_"]');
      const seasonInput = field.querySelector('input[name^="episodeSeason_"]');
      const episodeNumberInput = field.querySelector('input[name^="episodeNumber_"]');
      const directorInput = field.querySelector('input[name^="episodeDirector_"]');
      const durationInput = field.querySelector('input[name^="episodeDuration_"]');
      const descriptionInput = field.querySelector('textarea[name^="episodeDescription_"]');
      const videoInput = field.querySelector('input[name^="episodeVideo_"]');
      const posterInput = field.querySelector('input[name^="episodePoster_"]');
      
      if (titleInput && yearInput && seasonInput && episodeNumberInput && 
          titleInput.value.trim() && yearInput.value && seasonInput.value && episodeNumberInput.value) {
        
        // Process episode actors
        const episodeActors = [];
        const episodeActorFields = field.querySelectorAll('.episode-actors-container .actor-field');
        episodeActorFields.forEach(actorField => {
          const nameInput = actorField.querySelector('input[name^="episodeActorName_"]');
          const roleInput = actorField.querySelector('input[name^="episodeActorRole_"]');
          
          if (nameInput && roleInput && nameInput.value.trim() && roleInput.value.trim()) {
            episodeActors.push({
              name: nameInput.value.trim(),
              role: roleInput.value.trim()
            });
          }
        });
        
        // Add episode video file to form data with unique name
        if (videoInput && videoInput.files[0]) {
          formData.append(`episodeVideo_${index}`, videoInput.files[0]);
        }
        
        // Add episode poster file to form data with unique name
        if (posterInput && posterInput.files[0]) {
          formData.append(`episodePoster_${index}`, posterInput.files[0]);
        }
        
        episodes.push({
          title: titleInput.value.trim(),
          year: parseInt(yearInput.value),
          seasonNumber: parseInt(seasonInput.value),
          episodeNumber: parseInt(episodeNumberInput.value),
          director: directorInput ? directorInput.value.trim() : '',
          actors: episodeActors,
          durationSec: durationInput ? parseInt(durationInput.value) || 0 : 0,
          description: descriptionInput ? descriptionInput.value.trim() : '',
          hasVideo: videoInput && videoInput.files[0] ? true : false,
          hasPoster: posterInput && posterInput.files[0] ? true : false
        });
      }
    });
    
    // Add episodes metadata to form data
    formData.set('episodes', JSON.stringify(episodes));
    
    // Remove individual episode text fields from form data (keep files)
    const episodeTextInputs = form.querySelectorAll('input[name^="episode"], textarea[name^="episode"]');
    episodeTextInputs.forEach(input => formData.delete(input.name));
  }
  
  try {
    const data = await apiForm('/api/content', formData);
    showSuccess('Content added successfully!');
    document.getElementById('response-output').textContent = JSON.stringify(data, null, 2);
    
    // Show "Add another" button
    const addAnotherBtn = document.getElementById('addAnotherBtn');
    addAnotherBtn.style.display = 'block';
    addAnotherBtn.onclick = resetForm;
    
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Reset form for adding another content
 */
function resetForm() {
  const form = document.getElementById('add-content-form');
  form.reset();
  
  // Reset actors container
  const actorsContainer = document.getElementById('actors-container');
  actorsContainer.innerHTML = '';
  actorCount = 0;
  
  // Reset episodes container
  const episodesContainer = document.getElementById('episodes-container');
  episodesContainer.innerHTML = '';
  episodeCount = 0;
  
  // Reset content type fields
  toggleContentFields();
  
  // Hide "Add another" button
  document.getElementById('addAnotherBtn').style.display = 'none';
  
  // Clear messages and output
  clearMessage();
  document.getElementById('response-output').textContent = '';
  
  // Focus on title field
  document.getElementById('title').focus();
}

/**
 * Initialize the page
 */
function init() {
  const form = document.getElementById('add-content-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  const addActorBtn = document.getElementById('add-actor-btn');
  if (addActorBtn) {
    addActorBtn.addEventListener('click', addActor);
  }
  
  const actorsContainer = document.getElementById('actors-container');
  if (actorsContainer) {
    actorsContainer.addEventListener('click', handleActorsContainerClick);
  }
  
  const addEpisodeBtn = document.getElementById('add-episode-btn');
  if (addEpisodeBtn) {
    addEpisodeBtn.addEventListener('click', () => {
      console.log('Add episode button clicked');
      addEpisode();
    });
  }
  
  const episodesContainer = document.getElementById('episodes-container');
  if (episodesContainer) {
    episodesContainer.addEventListener('click', handleEpisodesContainerClick);
  }
  
  // Add initial actor field
  addActor();
  
  // Initialize content type fields
  toggleContentFields();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
