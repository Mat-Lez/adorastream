const AuditLog = require('../models/AuditLog');

async function audit(req, res, next) {
  const started = Date.now();
  const userId = req.session?.user?._id || null;
  const meta = {};
  // pick a few safe fields (avoid secrets)
  if (req.body && Object.keys(req.body).length) {
    const keys = Object.keys(req.body).slice(0, 8);
    meta.bodyKeys = keys; // just keys, not full body
  }
  
  res.on('finish', async () => {
    try {
      await AuditLog.create({
        userId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ip: req.ip,
        meta: { ...meta, ms: Date.now() - started }
      });
    } catch { /* avoid crashing on log errors */ }
  });
  next();
}

module.exports = { audit };