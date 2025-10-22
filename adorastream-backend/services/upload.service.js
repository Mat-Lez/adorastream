const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure temp upload directory under backend assets
const uploadDir = path.join(__dirname, '..', 'assets', 'tmp-uploads');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  // Avatar uploads will be skipped; profiles will still be created without avatars
  console.warn('Temp upload dir init failed; avatar uploads will be skipped; profiles will be created without avatars', {
    dir: uploadDir,
    error: err?.message || String(err)
  });
}

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

// Friendly middleware wrapper for single avatar uploads
function uploadAvatar(req, res, next) {
  upload.single('avatar')(req, res, (err) => {
    if (!err) return next();
    // Convert upload errors into a warning so controller can continue without avatar
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.uploadError = 'Image is too large. Max size is 5MB.';
    } else {
      req.uploadError = err.message || 'Avatar upload failed';
    }
    return next();
  });
}

module.exports = { upload, uploadAvatar };


