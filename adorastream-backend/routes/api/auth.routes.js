const router = require('express').Router();
const Auth = require('../../controllers/auth.controller');

router.post('/register', (req, res, next) => Auth.register(req, res).catch(next));
router.post('/login',    (req, res, next) => Auth.login(req, res).catch(next));
router.post('/logout',   (req, res, next) => Auth.logout(req, res));
router.post('/select-profile', (req, res, next) => Auth.selectProfile(req, res).catch(next));
router.get('/me',        (req, res, next) => { try { Auth.me(req, res); } catch (e) { next(e); } });
module.exports = router;