const express = require('express');
const path = require('path');
const router = express.Router();

// Resolve static HTML files, for example page(login) --> <path>/login.html
const page = (name) => path.join(__dirname, '../..', 'public', `${name}.html`);

function requireLogin(req, res, next) {
  if (req.session?.user?.id) return next();
  return res.redirect('/login');
}

router.get('/', requireLogin, (req, res) => {
  return res.redirect('/profile-selection');
});

router.get('/profile-selection', requireLogin, (req, res, next) => {
  res.sendFile(page('profile-selection'));
});

router.get('/add-profile', requireLogin, (req, res, next) => {
  res.sendFile(page('add-profile'));
});

router.get('/login', (req, res) => {
  if (req.session?.user?.id) {
    return res.redirect('/profile-selection');
  }
  res.sendFile(page('login'));
});

module.exports = router;