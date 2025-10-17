const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure temp upload directory under backend public
const uploadDir = path.join(__dirname, '..', 'public', 'tmp-uploads');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.error('Failed to initialize upload temp directory', {
    dir: uploadDir,
    error: err?.message || String(err)
  });
  throw err;
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

module.exports = { upload };


