const router = require('express').Router();
const Users = require('../controllers/user.controller');
const { requireLogin, requireAdmin, requireSelfOrAdmin } = require('../middleware/auth');

// admin-only list
router.get('/',        requireLogin, requireAdmin,           (req, res, next) => Users.list(req, res).catch(next));
// self or admin
router.get('/:id',     requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.get(req, res).catch(next));
router.patch('/:id',   requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.update(req, res).catch(next));
router.delete('/:id',  requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.remove(req, res).catch(next));

// profiles under the same user
router.post('/:id/profiles',                   requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.addProfile(req, res).catch(next));
router.delete('/:id/profiles/:profileId',      requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.removeProfile(req, res).catch(next));

module.exports = router;