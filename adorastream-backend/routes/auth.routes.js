const router = require('express').Router();
const Auth = require('../controllers/auth.controller');

router.post('/register', (req, res, next) => Auth.register(req, res).catch(next));
router.post('/login',    (req, res, next) => Auth.login(req, res).catch(next));
router.post('/logout',   (req, res, next) => Auth.logout(req, res));
module.exports = router;