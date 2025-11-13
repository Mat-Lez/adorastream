const ErrorLog = require('../models/errorLog');

function notFound(_req, res, _next) {
  res.status(404).json({ error: 'Not found' });
}

const SENSITIVE_REGEX = /(password|token|secret|authorization|apikey|session)/i;

function sanitizeObject(source) {
  if (!source || typeof source !== 'object' || Buffer.isBuffer(source)) {
    return source;
  }

  if (Array.isArray(source)) {
    return source.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (SENSITIVE_REGEX.test(key)) {
        sanitized[key] = '[redacted]';
      } else if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

function persistErrorLog(err, req, status) {
  const severity = status >= 500 ? 'critical' : status >= 400 ? 'error' : 'warning';
  const payload = {
    message: err.message || 'Unknown error',
    name: err.name,
    stack: err.stack,
    status,
    severity,
    component: req.route?.path || req.originalUrl || 'unknown',
    userId: req.session?.user?.id || null,
    request: {
      method: req.method,
      path: req.originalUrl,
      query: JSON.stringify(sanitizeObject(req.query)),
      body: JSON.stringify(sanitizeObject(req.body)),
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-request-id': req.headers['x-request-id']
      },
      ip: req.ip
    },
    meta: err.meta || undefined
  };

  setImmediate(() => {
    ErrorLog.create(payload).catch((logErr) => {
      console.error('Failed to persist error log:', logErr);
    });
  });
}

function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  persistErrorLog(err, req, status);

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
