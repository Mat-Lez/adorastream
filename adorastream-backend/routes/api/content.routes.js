const router = require('express').Router();
const Content = require('../../controllers/content.controller');
const { requireLogin, requireAdmin, requireProfileSelection } = require('../../middleware/auth');
const upload = require('../../services/videoUpload.service');

router.get('/',      (req, res, next) => Content.list(req, res).catch(next));
router.get('/next-episode', requireLogin, requireProfileSelection, (req, res, next) => Content.getNextEpisodeId(req, res).catch(next));
router.post('/select-content', requireLogin, requireProfileSelection, (req, res, next) => Content.selectContent(req, res).catch(next));
router.get('/:id/episodes', requireLogin, requireProfileSelection, (req, res, next) => Content.getEpisodesForSeries(req, res).catch(next));
router.get('/currently-played', requireLogin, requireProfileSelection, (req, res, next) => Content.currentlyPlayed(req, res).catch(next));

router.get('/:id',   (req, res, next) => Content.get(req, res).catch(next));
router.post('/',     requireLogin, requireAdmin,   upload.fields([{ name: 'poster', maxCount: 1 },{ name: 'video', maxCount: 1 }]),(req, res, next) => Content.create(req, res).catch(next));
router.patch('/:id', requireLogin, requireAdmin, (req, res, next) => Content.update(req, res).catch(next));
router.delete('/:id',requireLogin, requireAdmin, (req, res, next) => Content.remove(req, res).catch(next));

module.exports = router;