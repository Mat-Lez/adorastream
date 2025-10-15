/**
 * Add Content page functionality
 */

// Import utility functions
import { apiForm, showSuccess, showError, clearMessage } from '/utils/api-utils.js';

// Actor management
let actorCount = 0;

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
  
  // Add initial actor field
  addActor();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
