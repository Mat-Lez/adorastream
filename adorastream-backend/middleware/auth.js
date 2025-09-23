function requireLogin(req, _res, next) {
  if (!req.session?.user?.id) { const e = new Error('Unauthorized'); e.status = 401; throw e; }
  next();
}

function requireAdmin(req, _res, next) {
  const roles = req.session?.user?.roles || [];
  if (!roles.includes('admin')) { const e = new Error('Forbidden'); e.status = 403; throw e; }
  next();

}
function requireSelfOrAdmin(param = 'id') {
  return (req, _res, next) => {
    const me = String(req.session.user.id);
    const target = String(req.params[param] || '');
    const roles = req.session.user.roles || [];
    if (me !== target && !roles.includes('admin')) { const e = new Error('Forbidden'); e.status = 403; throw e; }
    next();
  };
}
module.exports = { requireLogin, requireAdmin, requireSelfOrAdmin };