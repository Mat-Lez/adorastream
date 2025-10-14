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

async function onSubmit(e){
  e.preventDefault();
  setMsg();
  // Must be authenticated and come from selection
  let userId = null;
  try {
    const me = await api('/api/auth/me', 'GET');
    userId = me?.user?.id || null;
  } catch (e) {
  location.href = '/login';
    return;
  }
  const name = document.getElementById('name').value.trim();
  const avatarUrl = document.getElementById('avatarUrl').value.trim();
  try {
    await api(`/api/users/${encodeURIComponent(userId)}/profiles`, 'POST', { name, avatarUrl });
    setMsg('Profile created', 'success');
    setTimeout(() => location.href = `/profile-selection?userId=${encodeURIComponent(userId)}`, 600);
  } catch (err) {
    setMsg(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addProfileForm').addEventListener('submit', onSubmit);
});


