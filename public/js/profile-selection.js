import { apiRequest as api } from '/utils/api-utils.js';
import { logoutEventListener } from '/utils/reuseableEventListeners.js';
import { switchProfile, deleteProfile } from '/utils/profilesManagement.js';

function setMsg(text='', type=''){
  const el = document.getElementById('msg');
  if (!el) return;
  el.textContent = text;
  el.className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
}

function card(html){
  const d = document.createElement('div');
  d.className = 'profile-card';
  d.innerHTML = html;
  return d;
}

async function loadProfiles(){
  // Must be authenticated
  let user = null;
  try {
    const me = await api('/api/auth/me', 'GET');
    const userId = me?.user?.id;
    if (!userId) { location.href = '/login'; return; }
    user = await api(`/api/users/${userId}`, 'GET');
  } catch (e) {
    location.href = '/login';
    return;
  }
  const container = document.getElementById('profiles');
  container.innerHTML = '';

  // Render existing profiles
  for (const p of (user.profiles || [])) {
    const avatarPath = p.avatarPath ? `/assets/${p.avatarPath}` : '';
    const avatarBlock = p.avatarPath
      ? `<div class="profile-avatar" style="background-image:url('${encodeURI(avatarPath)}')"></div>`
      : `<div class="profile-avatar">👤</div>`;

    const el = card(`${avatarBlock}
      <div class="profile-name">${p.name}</div>
      <div class="profile-actions">
        <button data-action="select" class="btn-select">Select</button>
        <button data-action="delete" class="btn-delete">Delete</button>
      </div>`);

    el.querySelector('[data-action="select"]').addEventListener('click', async () => {
      const errMsg = await switchProfile(p.id);
      if (errMsg) {
        setMsg(errMsg, 'error');
      }
    });

    el.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      const errMsg = await deleteProfile(user.id, p);
      if (errMsg) {
        setMsg(errMsg, 'error');
        return;
      }
      // Reload profiles
      await loadProfiles();
    });

    container.appendChild(el);
  }

  // Render add button if fewer than 5 profiles
  if ((user.profiles || []).length < 5) {
    const add = card(`<div class="add-profile-plus">+</div><div class="add-profile-label">Add profile</div>`);
    add.classList.add('add-profile-card');
    add.addEventListener('click', () => (location.href = '/add-profile'));
    container.appendChild(add);
  }
}

function onDOMContentLoaded(){
    loadProfiles();
    logoutEventListener('logout-btn');
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);