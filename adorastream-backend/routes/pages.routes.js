const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');

// Resolve static HTML files, for example page(login) --> <path>/login.html
const page = (name) => path.join(__dirname, '../..', 'public', `${name}.html`);

function requireLogin(req, res, next) {
  if (req.session?.user?.id) return next();
  return res.redirect('/login');
}

function requireProfileSelection(req, res, next) {
  if (req.session?.user?.profileId) return next();
  return res.redirect('/profile-selection');
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

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// No login check here, public page
router.get('/register', (req, res) => {
  res.sendFile(page('register'));
});

router.get('/add-content', requireLogin, requireAdmin, (req, res) => {
  res.sendFile(page('add-content'));
});

router.get('/content-main', requireLogin, requireProfileSelection, (req, res) => {
  res.sendFile(page('content-main'));
});

module.exports = router;