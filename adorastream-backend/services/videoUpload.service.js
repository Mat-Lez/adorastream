const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'poster') {
      cb(null, path.join(__dirname, '..', 'assets/posters'));
    } else if (file.fieldname === 'video') {
      cb(null, path.join(__dirname, '..', 'assets/videos'));
    } else {
      cb(new Error('Unknown field'), null);
    }
  },  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g,'_');
    cb(null, `${Date.now()}_${name}${ext}`);
  }
});

module.exports = multer({ storage, limits: { fileSize: 1024*1024*500 } }); // 500MB