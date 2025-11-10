function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  const wantsJson =
    req.xhr ||
    req.originalUrl.startsWith('/api') ||
    req.headers.accept?.includes('application/json');

  if (!wantsJson && status === 401) {
    return res.redirect('/login');
  }

  res.status(status).json({ error: err.message || 'Server error' });
}

module.exports = { notFound, errorHandler };