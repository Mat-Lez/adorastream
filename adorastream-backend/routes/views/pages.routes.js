const express = require('express');
//const path = require('path');
const router = express.Router();
const { requireAdmin, requireLogin, requireProfileSelection } = require('../../middleware/auth');
const { showLoginPage, showRegisterPage, showProfilesPage, 
    showAddProfilePage, showAddContentPage, showContentMainPage, 
    showMainSpecificPage, showMediaPlayerPage} = 
    require('../../controllers/pages.controller');
const noCache = require('../../middleware/noCache');
const requireFetch = require('../../middleware/internalFetch');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', noCache, showLoginPage);
router.get('/register', noCache, showRegisterPage);
router.get('/profile-selection', requireLogin, showProfilesPage);
router.get('/add-profile', requireLogin, showAddProfilePage);
router.get('/add-content', requireLogin, requireAdmin, showAddContentPage);
router.get('/content-main', requireLogin, requireProfileSelection, noCache, showContentMainPage);
router.get('/content-main/:page', requireLogin, requireProfileSelection, requireFetch, noCache, showMainSpecificPage);
router.get('/player', requireLogin, requireProfileSelection, showMediaPlayerPage);

module.exports = router;
