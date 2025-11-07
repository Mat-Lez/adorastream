async function api(path, method, body){
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function onLoginSubmit(e){
  e.preventDefault();
  setMsg();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  try {
    const data = await api('/api/auth/login', 'POST', { username, password });
    setMsg('Logged in successfully', 'success');
    const redirectUrl = '/profile-selection';
    setTimeout(() => location.href = redirectUrl, 300);
    // navigate to content listing placeholder

  } catch (err) {
    setMsg(err.message, 'error');
  }
}

async function onRegisterSubmit(e){
  e.preventDefault();
  setMsg();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  try {
    const data = await api('/api/auth/register', 'POST', { username, password });
    setMsg('Account created. You are now logged in.', 'success');
    setTimeout(() => location.href = `/profile-selection`, 300);
  } catch (err) {
    setMsg(err.message, 'error');
  }
}

function setMsg(text='', type=''){
  const el = document.getElementById('msg');
  if (!el) return;
  el.textContent = text;
  el.className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
}

function bindAuthForm(){
  const form = document.querySelector('form[data-auth]');
  if (!form) return;
  const mode = form.getAttribute('data-auth');
  form.addEventListener('submit', mode === 'login' ? onLoginSubmit : onRegisterSubmit);
}

document.addEventListener('DOMContentLoaded', bindAuthForm);


