import { apiRequest as api } from '/utils/api-utils.js';

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
    const avatarBlock = p.avatarUrl
      ? `<div class="profile-avatar" style="background-image:url('${encodeURI(p.avatarUrl)}')"></div>`
      : `<div class="profile-avatar">👤</div>`;

    const el = card(`${avatarBlock}
      <div class="profile-name">${p.name}</div>
      <div class="profile-actions">
        <button data-action="select" class="btn-select">Select</button>
        <button data-action="delete" class="btn-delete">Delete</button>
      </div>`);

    // Click handlers
    el.querySelector('button[data-action="select"]').onclick = async () => {
      try {
        // Call API to select profile (store the profileId in session)
        await api('/api/auth/select-profile', 'POST', { profileId: p.id });
        location.href = '/content-main';
      } catch (e) {
        setMsg(e.message, 'error');
      }
    };

    el.querySelector('button[data-action="delete"]').onclick = async () => {
      const ok = confirm(`Delete profile "${p.name}"? This cannot be undone.`);
      if (!ok) return;
      try {
        await api(`/api/users/${user.id}/profiles/${p.id}`, 'DELETE');
        await loadProfiles();
      } catch (e) {
        setMsg(e.message, 'error');
      }
    };

    container.appendChild(el);
  }

  // Render add button if fewer than 5 profiles
  if ((user.profiles || []).length < 5) {
    const add = card(`<div style="height:90px;display:flex;align-items:center;justify-content:center;font-size:42px">+</div><div style="margin-top:8px">Add profile</div>`);
    add.style.cursor = 'pointer';
    add.onclick = () => { location.href = `/add-profile`; };
    container.appendChild(add);
  }
}

function logoutEventListener(){
    const logout = document.getElementById('logout-btn');
    if (logout) {
        logout.addEventListener('click', () => {
            // navigate to /logout route which will destroy the session
            window.location.href = '/logout';
        });
    }
}

function onDOMContentLoaded(){
    loadProfiles();
    logoutEventListener();
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);


