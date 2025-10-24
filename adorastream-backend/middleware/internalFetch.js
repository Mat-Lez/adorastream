module.exports = (req, res, next) => {
  const isAjax = req.xhr || req.headers.accept?.includes('fetch') || req.headers['x-requested-with'] === 'XMLHttpRequest';
  if (!isAjax) {
    return res.redirect('/content-main');
  }
  next();
}