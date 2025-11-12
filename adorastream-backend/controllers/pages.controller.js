const crypto = require('crypto');
const Content = require('../models/content');
const { getGenreSections, fetchRandomizedContents } = require('./content.controller');

const availablePages = ['home', 'movies', 'shows', 'settings'];
const pageToLayoutMap = {
    home: {
      topbarLayout: ["SEARCH", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["LOGOUT_BUTTON", "PROFILE_DROPDOWN", "ADD_CONTENT_BUTTON"]
    },
    shows: {
      topbarLayout: ["SEARCH", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["LOGOUT_BUTTON", "PROFILE_DROPDOWN", "ADD_CONTENT_BUTTON"]
    },
    movies: {
      topbarLayout: ["SEARCH", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["LOGOUT_BUTTON", "PROFILE_DROPDOWN", "ADD_CONTENT_BUTTON"]
    },
    settings: {
      topbarLayout: ["TOPBAR_ACTIONS"],
      topbarActionsLayout: ["LOGOUT_BUTTON", "PROFILE_DROPDOWN", "ADD_CONTENT_BUTTON"]
    },
};
const pageSearchScopes = {
  home: 'all',
  movies: 'movie',
  shows: 'series'
};

exports.showLoginPage = (req, res) => {
  if (req.session?.user?.id) {
    return res.redirect('/profile-selection');
  }
  res.render('pages/login', {
    title: 'Login - AdoraStream',
    scripts: ['auth'] 
  });
}

exports.showRegisterPage = (req, res) => {
  res.render('pages/register', {
    title: 'Login - AdoraStream',
    scripts: ['auth'] 
  });
}

exports.showProfilesPage = (req, res) => {    
  res.render('pages/profile-selection', {
    title: 'Profiles - AdoraStream',
    scripts: ['profileSelection'],
    additional_css: ['profileSelection', 'buttons']
  });
}

exports.showAddProfilePage = (req, res) => {    
  res.render('pages/add-profile', {
    title: 'Profiles - AdoraStream',
    scripts: ['addProfile']  
  });
}

exports.showAddContentPage = (req, res) => {    
  res.render('pages/add-content', {
    title: 'Add Content - AdoraStream',
    scripts: ['addContent'],
    additional_css: ['addContent']  });
}

async function attachGenreSections(renderOptions) {
  renderOptions.genreSections = await getGenreSections();
}

const ENDLESS_SCROLLING_CONTENT_AMOUNT = Number(process.env.ENDLESS_SCROLLING_CONTENT_AMOUNT) || 20;

async function attachContentGrid(renderOptions, typeFilter) {
  const limit = ENDLESS_SCROLLING_CONTENT_AMOUNT;
  const filter = typeFilter ? { type: typeFilter } : {};
  const randomSeed = crypto.randomBytes(8).toString('hex');

  const { contents: gridItems, total } = await fetchRandomizedContents(filter, { limit, seed: randomSeed });

  renderOptions.gridItems = gridItems;
  renderOptions.gridTitle = typeFilter === 'movie' ? 'Movies' : 'Shows';
  renderOptions.gridPagination = {
    page: 1,
    limit,
    total,
    type: typeFilter || '',
    randomSeed
  };
}

exports.showContentMainPage = async (req, res) => {   
  const { user, profiles, activeProfileId } = res.locals;

  if (!user) {
    return res.redirect('/login');
  }

  const renderOptions = {
    title: 'Main - AdoraStream',
    scripts: ['contentMain'],
    additional_css: ['contentMain', 'buttons'],
    user,
    profiles,
    activeProfileId,
    topbarLayout: pageToLayoutMap['home'].topbarLayout,
    topbarActionsLayout: pageToLayoutMap['home'].topbarActionsLayout,
    searchScope: pageSearchScopes.home
  };

  await attachGenreSections(renderOptions);

  res.render('pages/content-main', renderOptions);
}

exports.showMainSpecificPage = async (req, res) => {
  const page = getRequestedPage(req, availablePages, 'home');
  await showPage(req, res, page, `partials/main-${page}`);
}

exports.showTopbar = async (req, res) => {
  const page = getRequestedPage(req, availablePages, 'home');
  await showPage(req, res, page, 'partials/main-topbar');
}

async function showPage(req, res, page, renderPath) {
  const { user, profiles, activeProfileId } = res.locals;

  if (!user) {
    return res.status(403).send('User not found');
  }

  const renderOptions = {
    layout: false,
    user,
    profiles,
    activeProfileId,
    topbarLayout: pageToLayoutMap[page].topbarLayout,
    topbarActionsLayout: pageToLayoutMap[page].topbarActionsLayout,
    initialSettingsPage: page === 'settings' ? (req.query.tab === 'statistics' ? 'statistics' : 'manage-profiles') : undefined
  };
  renderOptions.searchScope = pageSearchScopes[page] || 'all';

  if (page === 'home') {
    await attachGenreSections(renderOptions);
  }

  if (['movies', 'shows'].includes(page)) {
    const typeFilter = page === 'movies' ? 'movie' : 'series';
    await attachContentGrid(renderOptions, typeFilter);
  }

  res.render(renderPath, renderOptions);
}

function getRequestedPage(req, availablePages, defaultPage) {
  let { page } = req.params;
  if (page === undefined || !availablePages.includes(page)) {
    page = defaultPage;
  }
  return page;
}

exports.showSettingsSpecificPage = async (req, res) => {
  const availablePages = ['manage-profiles', 'statistics'];
  const page = getRequestedPage(req, availablePages, 'manage-profiles');

  const { user, profiles, activeProfileId } = res.locals;

  if (!user) {
    return res.status(403).send('User not found');
  }

  res.render(`partials/main-settings-${page}`, {
    layout: false,
    user,
    profiles,
    activeProfileId,
  });
}

// Reach here from /settings/profiles/:action
exports.showSettingsProfileActionPage = async (req, res) => {
  const availablePages = ['add', 'edit'];
  let { action } = req.params;
  const profileIdToEdit = req.query.id;
  const { user, profiles, activeProfileId } = res.locals;

  if (!user) {
    return res.status(403).send('User not found');
  }

  if ((action === undefined || !availablePages.includes(action)) || (action === "edit" && !profileIdToEdit)) {
    action = "manage-profiles";
    res.render(`partials/main-settings-${action}`, {
      layout: false,
      profiles,
      activeProfileId
    });
    return;
  }  
  
  res.render(`partials/main-settings-${action}-profile`, {
    layout: false,
    profiles,
    activeProfileId,
    profile: profiles.find(p => String(p._id) === String(profileIdToEdit)) || undefined
  });
}

exports.showMediaPlayerPage = async (req, res) => {    
  const contentId = req.session.user.contentId;
  if (!contentId) {
    return res.redirect('/content-main');
  }
  const media = await Content.findOne({ _id: contentId }).lean();
  res.render('pages/player', {
    title: 'Play - AdoraStream',
    content: media,
    scripts: ['player'],
    additional_css: ['player'] 
  });
}
