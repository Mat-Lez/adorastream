// Tells browsers and proxies not to cache this page.
// That makes sure to always get the most up-to-date content and not stored or reused versions.
// A user that logs out will not be able to use the back button to see cached authenticated pages.
module.exports = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Permissions-Policy': 'interest-cohort=()'
  });
  next();
};