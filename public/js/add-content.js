/**
 * Add Content page functionality
 */

// Import utility functions
import { apiForm, apiRequest, showSuccess, showError, clearMessage } from '/utils/api-utils.js';

// Actor management
let actorCount = 0;
let episodeCount = 0;

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
        <input name="actorName_${actorCount}" class="input" type="text" placeholder="e.g., Tom Hardy" />
      </div>
      <div class="field">
        <label class="label">Role</label>
        <input name="actorRole_${actorCount}" class="input" type="text" placeholder="e.g., Bane" />
      </div>
      <div class="field">
        <label class="label">Wikipedia URL</label>
        <input name="actorWikipedia_${actorCount}" class="input" type="url" placeholder="e.g., https://en.wikipedia.org/wiki/Tom_Hardy" />
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

// Episodes management (for batch add)
function addEpisodeForm() {
  episodeCount++;
  const container = document.getElementById('episodes-container');
  const div = document.createElement('div');
  div.className = 'episode-field';
  div.dataset.epIndex = String(episodeCount);
  div.innerHTML = `
    <div class="field-row">
      <div class="field"><label class="label">Season #</label><input name="ep_season_${episodeCount}" class="input" type="number" min="1" placeholder="1" required /></div>
      <div class="field"><label class="label">Episode #</label><input name="ep_number_${episodeCount}" class="input" type="number" min="1" placeholder="1" required /></div>
    </div>
    <div class="field"><label class="label">Episode Title</label><input name="ep_title_${episodeCount}" class="input" type="text" placeholder="" required /></div>
    <div class="field"><label class="label">Description</label><textarea name="ep_desc_${episodeCount}" class="input" placeholder=""></textarea></div>
    <div class="field"><label class="label">Director</label><input name="ep_director_${episodeCount}" class="input" type="text" placeholder="" /></div>
    <div class="field"><label class="label">Actors</label>
      <div class="ep-actors-container"></div>
      <button type="button" class="btn btn-secondary" data-action="add-ep-actor">Add Actor</button>
    </div>
    <div class="field"><label class="label">Episode Poster</label><input class="input" type="file" name="ep_poster_${episodeCount}" accept="image/*"></div>
    <div class="field"><label class="label">Episode Video (MP4)</label><input class="input" type="file" name="ep_video_${episodeCount}" accept="video/mp4" required></div>
    <div class="field"><button type="button" class="btn btn-danger" data-action="remove-episode">Remove Episode</button></div>
    <hr/>
  `;
  container.appendChild(div);
}

function handleEpisodesContainerClick(e) {
  const target = e.target;
  if (target && target.matches('button[data-action="remove-episode"]')) {
    const wrapper = target.closest('.episode-field');
    if (wrapper) wrapper.remove();
  }
  if (target && target.matches('button[data-action="add-ep-actor"]')) {
    const wrapper = target.closest('.episode-field');
    if (!wrapper) return;
    const actorsContainer = wrapper.querySelector('.ep-actors-container');
    const row = document.createElement('div');
    row.className = 'ep-actor-field';
    row.innerHTML = `
      <div class="field-row">
        <div class="field"><input class="input" type="text" placeholder="Actor Name"></div>
        <div class="field"><input class="input" type="text" placeholder="Role"></div>
        <div class="field"><input class="input" type="text" placeholder="Wikipedia URL (optional)"></div>
        <button type="button" class="btn btn-danger" data-action="remove-ep-actor">Remove</button>
      </div>
    `;
    actorsContainer.appendChild(row);
  }
  if (target && target.matches('button[data-action="remove-ep-actor"]')) {
    const row = target.closest('.ep-actor-field');
    if (row) row.remove();
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
  const typeEl = document.getElementById('type');
  const type = typeEl ? typeEl.value : 'movie';
  
  // Process actors
  const actors = [];
  const actorFields = document.querySelectorAll('.actor-field');
  
  actorFields.forEach(field => {
    const nameInput = field.querySelector('input[name^="actorName_"]');
    const roleInput = field.querySelector('input[name^="actorRole_"]');
    const wikiInput = field.querySelector('input[name^="actorWikipedia_"]');
    
    if (nameInput && roleInput && nameInput.value.trim() && roleInput.value.trim()) {
      actors.push({
        name: nameInput.value.trim(),
        role: roleInput.value.trim(),
        wikipedia: wikiInput?.value.trim() || ''
      });
    }
  });
  
  // Add actors to form data
  formData.set('actors', JSON.stringify(actors));
  
  // Remove individual actor fields from form data
  const actorInputs = form.querySelectorAll('input[name^="actorName_"], input[name^="actorRole_"], input[name^="actorWikipedia_"]');
  actorInputs.forEach(input => formData.delete(input.name));
  
  try {
    let data;
    if (type === 'movie') {
      data = await apiForm('/api/content', formData);
    } else if (type === 'series-new') {
      // Use only relevant fields
      const seriesForm = new FormData();
      seriesForm.set('title', formData.get('title') || '');
      seriesForm.set('genres', formData.get('genres') || '');
      seriesForm.set('description', (document.getElementById('series-description') ? document.getElementById('series-description').value : '') || '');
      seriesForm.set('creators', document.getElementById('series-creators').value || '');
      seriesForm.set('numberOfSeasons', document.getElementById('series-num-seasons').value || '0');
      const poster = formData.get('poster');
      if (poster && poster.size) seriesForm.set('poster', poster);
      data = await apiForm('/api/series', seriesForm);
    } else if (type === 'episode') {
      const seriesId = document.getElementById('series-select').value;
      const episodes = [];
      const epNodes = document.querySelectorAll('.episode-field');
      const epForm = new FormData();
      epNodes.forEach((node, idx) => {
        const season = node.querySelector('input[name^="ep_season_"]').value || '1';
        const number = node.querySelector('input[name^="ep_number_"]').value || '1';
        const title = node.querySelector('input[name^="ep_title_"]').value || '';
        const desc = node.querySelector('textarea[name^="ep_desc_"]').value || '';
        const dir = node.querySelector('input[name^="ep_director_"]').value || '';
        const actorsArr = [];
        const epActorRows = node.querySelectorAll('.ep-actor-field');
        epActorRows.forEach(row => {
          const name = (row.querySelector('input[placeholder="Actor Name"]')?.value || '').trim();
          const role = (row.querySelector('input[placeholder="Role"]')?.value || '').trim();
          const wikipedia = (row.querySelector('input[placeholder="Wikipedia URL (optional)"]')?.value || '').trim();

          if (name) actorsArr.push({ name, role, wikipedia });
        });
        episodes.push({
          title,
          description: desc,
          seasonNumber: season,
          episodeNumber: number,
          director: dir,
          actors: actorsArr
        });
        const posterInput = node.querySelector('input[name^="ep_poster_"]');
        if (posterInput && posterInput.files && posterInput.files[0]) {
          epForm.append('posters', posterInput.files[0]);
        } else {
          epForm.append('posters', new Blob([]));
        }
        const videoInput = node.querySelector('input[name^="ep_video_"]');
        if (videoInput && videoInput.files && videoInput.files[0]) {
          epForm.append('videos', videoInput.files[0]);
        } else {
          epForm.append('videos', new Blob([]));
        }
      });
      epForm.set('episodes', JSON.stringify(episodes));
      data = await apiForm(`/api/series/${seriesId}/episodes-batch`, epForm);
    }
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
  
  // Do not add actor field by default; add only for movie mode on demand

  // Type toggle and series UI wiring
  const typeEl = document.getElementById('type');
  const seriesSection = document.getElementById('series-section');
  const episodesSection = document.getElementById('episodes-section');
  const videoField = document.getElementById('video-field');
  const createFields = document.getElementById('create-series-fields');
  const seriesSelect = document.getElementById('series-select');
  const addEpisodeBtn = document.getElementById('add-episode-btn');
  const episodesContainer = document.getElementById('episodes-container');
  const yearField = document.getElementById('year-field');
  const directorField = document.getElementById('director-field');
  const actorsSection = document.getElementById('actors-section');
  const descriptionField = document.getElementById('description-field');
  const seriesDescriptionField = document.getElementById('series-description-field');
  const titleField = document.getElementById('title-field');
  const genresField = document.getElementById('genres-field');
  const posterField = document.getElementById('poster-field');

  async function loadSeriesOptions() {
    try {
      const list = await apiRequest('/api/series');
      if (Array.isArray(list) && seriesSelect) {
        seriesSelect.innerHTML = list
          .map(s => `<option value="${s.id}">${s.title || 'Untitled Series'}</option>`) 
          .join('');
      }
    } catch (e) {
      // ignore
    }
  }

  function handleTypeChange() {
    if (!typeEl) return;
    const mode = typeEl.value;
    const isMovie = mode === 'movie';
    const isSeriesNew = mode === 'series-new';
    const isEpisode = mode === 'episode';

    if (seriesSection) seriesSection.style.display = isSeriesNew ? '' : 'none';
    if (episodesSection) episodesSection.style.display = isEpisode ? '' : 'none';

    if (yearField) yearField.style.display = isMovie ? '' : 'none';
    if (directorField) directorField.style.display = isMovie ? '' : 'none';
    if (videoField) videoField.style.display = isMovie ? '' : 'none';
    if (actorsSection) {
      actorsSection.style.display = isMovie ? '' : 'none';
      if (isMovie) {
        const hasActor = document.querySelector('.actor-field');
        if (!hasActor) addActor();
      }
    }
    if (descriptionField) descriptionField.style.display = isMovie ? '' : 'none';
    if (seriesDescriptionField) seriesDescriptionField.style.display = isSeriesNew ? '' : 'none';
    if (titleField) titleField.style.display = isEpisode ? 'none' : '';
    if (genresField) genresField.style.display = isEpisode ? 'none' : '';
    if (posterField) posterField.style.display = isEpisode ? 'none' : '';

    // Toggle required on hidden global title
    const titleInput = document.getElementById('title');
    if (titleInput) titleInput.required = !isEpisode; // required for movie/series-new, not for episode

    // Ensure at least one episode form exists in episode mode
    if (isEpisode) {
      const hasEpisode = document.querySelector('.episode-field');
      if (!hasEpisode) addEpisodeForm();
    }

    if (isEpisode) {
      loadSeriesOptions();
    }
  }

  // removed unused handleSeriesActionChange
  if (typeEl) {
    typeEl.addEventListener('change', handleTypeChange);
    handleTypeChange();
  }
  if (episodesContainer) {
    episodesContainer.addEventListener('click', handleEpisodesContainerClick);
  }
  if (addEpisodeBtn) {
    addEpisodeBtn.addEventListener('click', addEpisodeForm);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
