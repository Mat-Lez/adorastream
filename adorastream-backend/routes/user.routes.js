const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Users = require('../controllers/user.controller');
const { requireLogin, requireAdmin, requireSelfOrAdmin } = require('../middleware/auth');

// admin-only list
router.get('/',        requireLogin, requireAdmin,           (req, res, next) => Users.list(req, res).catch(next));
// self or admin
router.get('/:id',     requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.get(req, res).catch(next));
router.patch('/:id',   requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.update(req, res).catch(next));
router.delete('/:id',  requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.remove(req, res).catch(next));

// profiles under the same user
const uploadDir = path.join(__dirname, '..', 'public', 'tmp-uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${unique}${ext}`);
  }
});

const fileFilter = function (_req, file, cb) {
  const allowed = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
  if (!allowed.has((file.mimetype || '').toLowerCase())) {
    return cb(new Error('Invalid file type'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
router.post('/:id/profiles',                   requireLogin, requireSelfOrAdmin('id'), upload.single('avatar'), (req, res, next) => Users.addProfile(req, res).catch(next));
router.delete('/:id/profiles/:profileId',      requireLogin, requireSelfOrAdmin('id'), (req, res, next) => Users.removeProfile(req, res).catch(next));

module.exports = router;