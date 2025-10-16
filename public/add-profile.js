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
  const fileInput = document.getElementById('avatar');
  const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

  // Client-side validation for image file
  if (file) {
    const allowed = ['image/png','image/jpeg','image/jpg','image/gif','image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!allowed.includes(file.type)) {
      setMsg('Please upload a valid image file (PNG, JPG, JPEG, GIF, WEBP).', 'error');
      return;
    }
    if (file.size > maxSize) {
      setMsg('Image is too large. Max size is 5MB.', 'error');
      return;
    }
  }

  try {
    const formData = new FormData();
    formData.set('name', name);
    if (file) formData.set('avatar', file);

    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/profiles`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (!res.ok) {
      let msg = 'Request failed';
      try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
      throw new Error(msg);
    }
    await res.json();
    setMsg('Profile created', 'success');
    setTimeout(() => location.href = `/profile-selection?userId=${encodeURIComponent(userId)}`, 600);
  } catch (err) {
    setMsg(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addProfileForm').addEventListener('submit', onSubmit);
});


