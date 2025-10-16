const express = require('express');
//const path = require('path');
const router = express.Router();
const { requireAdmin, requireLogin } = require('../../middleware/auth');
const { showLoginPage, showRegisterPage, logout, showProfilesPage, 
    showAddProfilePage, showAddContentPage, showContentMainPage } = 
    require('../../controllers/pages.controller');
const noCache = require('../../middleware/noCache');

router.get('/', showLoginPage);
router.get('/login', noCache, showLoginPage);
router.get('/logout', logout);
router.get('/register', noCache, showRegisterPage);
router.get('/profile-selection', requireLogin, showProfilesPage);
router.get('/add-profile', requireLogin, showAddProfilePage);
router.get('/add-content', requireLogin, requireAdmin, showAddContentPage);
router.get('/content-main', requireLogin, requireAdmin, showContentMainPage);

module.exports = router;
