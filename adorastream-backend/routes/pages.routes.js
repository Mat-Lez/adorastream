const express = require('express');
const path = require('path');
const router = express.Router();

// Resolve static HTML files, for example page(login) --> <path>/login.html
const page = (name) => path.join(__dirname, '../..', 'public', `${name}.html`);

router.get('/', (req, res) => {
  if (req.session?.user?.id) {
    return res.redirect('/profile-selection');
  }
  return res.redirect('/login');
});

router.get('/profile-selection', (req, res, next) => {
  if (!req.session?.user?.id) return res.redirect('/login');
  res.sendFile(page('profile-selection'));
});

router.get('/add-profile', (req, res, next) => {
  if (!req.session?.user?.id) return res.redirect('/login');
  res.sendFile(page('add-profile'));
});

router.get('/login', (req, res) => {
  if (req.session?.user?.id) {
    return res.redirect('/profile-selection');
  }
  res.sendFile(page('login'));
});

module.exports = router;