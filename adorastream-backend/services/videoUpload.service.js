const path = require('path');
const multer = require('multer');

const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const baseAssets = path.join(__dirname, '..', 'assets');
      let targetDir;
      if (file.fieldname === 'poster' || file.fieldname === 'posters') {
        targetDir = path.join(baseAssets, 'posters');
      } else if (file.fieldname === 'video' || file.fieldname === 'videos') {
        targetDir = path.join(baseAssets, 'videos');
      } else {
        return cb(new Error('Unknown field'), null);
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

module.exports = multer({ storage, limits: { fileSize: 1024*1024*500 } }); // 500MB