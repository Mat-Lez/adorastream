const router = require('express').Router();
const SeriesCtl = require('../../controllers/content.controller');
const { requireLogin, requireAdmin } = require('../../middleware/auth');
const upload = require('../../services/videoUpload.service');

router.get('/', (req, res, next) => SeriesCtl.listSeries(req, res).catch(next));
router.get('/:id', (req, res, next) => SeriesCtl.getSeries(req, res).catch(next));

router.post(
  '/',
  requireLogin,
  requireAdmin,
  upload.fields([{ name: 'poster', maxCount: 1 }]),
  (req, res, next) => SeriesCtl.createSeries(req, res).catch(next)
);

router.post(
  '/:id/episodes',
  requireLogin,
  requireAdmin,
  upload.fields([{ name: 'poster', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  (req, res, next) => SeriesCtl.addEpisode(req, res).catch(next)
);

router.post(
  '/:id/episodes-batch',
  requireLogin,
  requireAdmin,
  upload.fields([{ name: 'posters', maxCount: 50 }, { name: 'videos', maxCount: 50 }]),
  (req, res, next) => SeriesCtl.addEpisodesBatch(req, res).catch(next)
);

module.exports = router;


