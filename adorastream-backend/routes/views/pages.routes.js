const express = require('express');
//const path = require('path');
const router = express.Router();
const { requireAdmin, requireLogin, requireProfileSelection } = require('../../middleware/auth');
const { showLoginPage, showRegisterPage, showProfilesPage, 
    showAddProfilePage, showAddContentPage, showContentMainPage } = 
    require('../../controllers/pages.controller');
const noCache = require('../../middleware/noCache');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', noCache, showLoginPage);
router.get('/register', noCache, showRegisterPage);
router.get('/profile-selection', requireLogin, showProfilesPage);
router.get('/add-profile', requireLogin, showAddProfilePage);
router.get('/add-content', requireLogin, requireAdmin, showAddContentPage);
router.get('/content-main', requireLogin, requireProfileSelection, showContentMainPage);

module.exports = router;
