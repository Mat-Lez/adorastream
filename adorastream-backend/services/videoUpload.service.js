const path = require('path');
const multer = require('multer');

const fs = require('fs');

const isPosterField = (name = '') =>
  name === 'poster' ||
  name === 'posters' ||
  name.startsWith('ep_poster_');

const isVideoField = (name = '') =>
  name === 'video' ||
  name === 'videos' ||
  name.startsWith('ep_video_');

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    try {
      const baseAssets = path.join(__dirname, '..', 'assets');
      let targetDir;
      if (isPosterField(file.fieldname)) {
        targetDir = path.join(baseAssets, 'posters');
      } else if (isVideoField(file.fieldname)) {
        targetDir = path.join(baseAssets, 'videos');
      } else {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      }
      fs.mkdirSync(targetDir, { recursive: true });
      cb(null, targetDir);
    } catch (e) {
      cb(e, null);
    }
  },  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g,'_');
    cb(null, `${Date.now()}_${name}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (isPosterField(file.fieldname) || isVideoField(file.fieldname)) {
    return cb(null, true);
  }
  return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 1024*1024*500 } }); // 500MB