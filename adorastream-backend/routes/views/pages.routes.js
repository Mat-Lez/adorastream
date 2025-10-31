const express = require('express');
//const path = require('path');
const router = express.Router();
const { requireAdmin, requireLogin, requireProfileSelection } = require('../../middleware/auth');
const { showLoginPage, showRegisterPage, showProfilesPage, 
    showAddProfilePage, showAddContentPage, showContentMainPage,
    showMainSpecificPage, showSettingsSpecificPage, showSettingsProfileActionPage,
    showTopbar, showMediaPlayerPage, showEpisodesDetailedList, showActorsList} = 
    require('../../controllers/pages.controller');
const noCache = require('../../middleware/noCache');
const requireFetch = require('../../middleware/internalFetch');
const loadUserContext = require('../../middleware/loadUserContext');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', noCache, showLoginPage);
router.get('/register', noCache, showRegisterPage);
router.get('/profile-selection', requireLogin, showProfilesPage);
router.get('/add-profile', requireLogin, showAddProfilePage);
router.get('/add-content', requireLogin, requireAdmin, showAddContentPage);
router.get('/topbar/:page', requireLogin, requireProfileSelection, noCache, requireFetch, loadUserContext, showTopbar);
router.get('/content-main', requireLogin, requireProfileSelection, noCache, loadUserContext, showContentMainPage);
router.get('/content-main/:page', requireLogin, requireProfileSelection, requireFetch, noCache, loadUserContext, showMainSpecificPage);
router.get('/settings/:page', requireLogin, requireProfileSelection, noCache, requireFetch, loadUserContext, showSettingsSpecificPage);
router.get('/settings/profiles/:action', requireLogin, requireProfileSelection, noCache, requireFetch, loadUserContext, showSettingsProfileActionPage);
router.get('/player', requireLogin, requireProfileSelection, showMediaPlayerPage);
<<<<<<< HEAD
<<<<<<< HEAD
router.get('/content-main', requireLogin, requireProfileSelection, noCache, showContentMainPage);
router.get('/content-main/:page', requireLogin, requireProfileSelection, requireFetch, noCache, showMainSpecificPage);
router.get('/content-main/preview/:contentId/episodes', requireLogin, requireProfileSelection, showEpisodesDetailedList);
router.get('/content-main/preview/:contentId/actors', requireLogin, requireProfileSelection, showActorsList);

=======
router.get('/content-main/:page', requireLogin, requireProfileSelection, showMainSpecificPage);
>>>>>>> 13201a6 (resolve conflict)
=======
router.get('/content-main', requireLogin, requireProfileSelection, noCache, showContentMainPage);
router.get('/content-main/:page', requireLogin, requireProfileSelection, requireFetch, noCache, showMainSpecificPage);
>>>>>>> 2fe1144 (resolve-conflicts)

module.exports = router;
