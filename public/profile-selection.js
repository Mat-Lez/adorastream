async function api(path, method='GET', body){
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

function setMsg(text='', type=''){
  const el = document.getElementById('msg');
  if (!el) return;
  el.textContent = text;
  el.className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
}

function card(html){
  const d = document.createElement('div');
  d.style.border = '1px solid #30363d';
  d.style.borderRadius = '10px';
  d.style.padding = '16px';
  d.style.background = '#0b0f14';
  d.style.textAlign = 'center';
  d.innerHTML = html;
  return d;
}

async function loadProfiles(){
  // Must be authenticated
  let user = null;
  try {
    const me = await api('/api/auth/me', 'GET');
    const userId = me?.user?.id;
    if (!userId) throw new Error('No session');
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
      ? `<div style="height:100px;width:100px;margin:0 auto;border-radius:50%;background:#111;background-size:cover;background-position:center;background-image:url('${encodeURI(p.avatarUrl)}')"></div>`
      : `<div style="height:100px;width:100px;margin:0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#111;font-size:42px">👤</div>`;
    const el = card(`${avatarBlock}<div style="margin-top:8px">${p.name}</div>`);
    el.style.cursor = 'pointer';
    el.onclick = async () => {
      // Store selected profile in session (optional: call a backend endpoint if you prefer)
      sessionStorage.setItem('profileId', p.id);
      sessionStorage.setItem('userId', user.id);
      location.href = '/'; // go to your main app entry
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

document.addEventListener('DOMContentLoaded', loadProfiles);


