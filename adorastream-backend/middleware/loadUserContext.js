const User = require('../models/user');

module.exports = async function loadUserContext(req, res, next) {
  try {
    if (!req?.session?.user?.id) {
      return res.redirect('/login');
    }

    const user = await User.findOne({ _id: req.session.user.id }).lean({ virtuals: true });

    if (!user) {
      const isAjax = req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';
      if (isAjax) {
        return res.status(403).send('User not found');
      }
      return res.redirect('/login');
    }

    user.isAdmin = (user.roles || []).includes('admin');

    res.locals.user = user;
    res.locals.profiles = user.profiles;
    res.locals.activeProfileId = req.session.user.profileId;

    next();
  } catch (err) {
    next(err);
  }
};

