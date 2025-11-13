const Content = require('../models/content');
const StatsController = require('../controllers/stats.controller');

const { _getSortedEpisodes, getGenreSections, getContentGrid } = require('./content.controller');

const availablePages = ['home', 'movies', 'shows', 'settings'];
const pageToLayoutMap = {
    home: {
      topbarLayout: ["SEARCH", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["LOGOUT_BUTTON", "PROFILE_DROPDOWN", "ADD_CONTENT_BUTTON"]
    },
    shows: {
      topbarLayout: ["SEARCH", "FILTERS", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["LOGOUT_BUTTON", "PROFILE_DROPDOWN", "ADD_CONTENT_BUTTON"]
    },
    movies: {
      topbarLayout: ["SEARCH", "FILTERS", "TOPBAR_ACTIONS"],
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

async function attachContentGrid(renderOptions, typeFilter) {
  renderOptions.gridItems = await getContentGrid(typeFilter);
  renderOptions.gridTitle = typeFilter === 'movie' ? 'Movies' : 'Shows';
}

async function attachRecommendations(renderOptions, userId, profileId) {
  try {
    renderOptions.recommendations = await StatsController.getRecommendedContent(userId, profileId);
  } catch (err) {
    console.error("Failed to attach recommendations:", err.message);
    renderOptions.recommendations = [];
  }
}

exports.showContentMainPage = async (req, res) => {   
  const { user, profiles, activeProfileId } = res.locals;

  if (!user) {
    return res.redirect('/login');
  }

  const renderOptions = {
    title: 'Main - AdoraStream',
    scripts: ['contentMain', 'mediaPreview'],
    additional_css: ['contentMain', 'buttons', 'mediaPreview'],
    user,
    profiles,
    activeProfileId,
    topbarLayout: pageToLayoutMap['home'].topbarLayout,
    topbarActionsLayout: pageToLayoutMap['home'].topbarActionsLayout,
    searchScope: pageSearchScopes.home
  };

  await attachGenreSections(renderOptions);
  await attachRecommendations(renderOptions, user._id, activeProfileId);

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

  if ((page === 'home' || renderOptions.topbarLayout?.includes("FILTERS")) && !renderOptions.genreSections) {
    await attachGenreSections(renderOptions);
    await attachRecommendations(renderOptions, user._id, activeProfileId);
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

  const { contentId, currentEpisodeId } = req.query;
  const lastPositionSec = Number(req.query.lastPositionSec) || 0; 

  if (!contentId) {
    return res.redirect('/content-main');
  }
  
  // Fetch the content
  const media = await Content.findById(contentId).lean();
  if (!media) {
    return res.status(404).send('Content not found');
  }

  let currentEpisode = null;

  if (media.type === 'series') {
    const allEpisodes = _getSortedEpisodes(media);

    currentEpisode = allEpisodes.find(ep => ep._id.toString() === currentEpisodeId) || allEpisodes[0];
  }

  // Save it in the session and persist
  req.session.user.contentId = contentId;
  req.session.user.currentEpisodeId = currentEpisode ? currentEpisode._id : null;

  await new Promise((resolve, reject) => {
    req.session.save(err => (err ? reject(err) : resolve()));
  });

  res.render('pages/player', {
    title: 'Play - AdoraStream',
    content: media,
    lastPositionSec: lastPositionSec,
    currentEpisode,
    scripts: ['player'],
    additional_css: ['player'] 
  });
}

exports.showPreviewPage = async (req, res) => {
  const { contentId, currentEpisodeId } = req.query;

  if (!contentId) {
    return res.redirect('/content-main');
  }
  // Fetch the content
  const media = await Content.findById(contentId).lean();
  if (!media) {
    return res.status(404).send('Content not found');
  }

  let currentEpisode = null;

  if (media.type === 'series') {
    const allEpisodes = _getSortedEpisodes(media);

    currentEpisode = allEpisodes.find(ep => ep._id.toString() === currentEpisodeId) || allEpisodes[0];
  }
   res.render('pages/player', {
    title: 'Play - AdoraStream',
    content: media,
    currentEpisode,
    scripts: ['player'],
    additional_css: ['player'] 
  });
};


exports.showEpisodesDetailedList = async (req, res) => {
  const { contentId } = req.params;
  if (!contentId) {
    return res.redirect('/content-main');
  }

  const content = await Content.findById(contentId).lean();
    if (!content || content.type !== 'series') {
      return res.status(404).send('No episodes found');
    }

  const episodes = _getSortedEpisodes(content);
  res.render('partials/preview-episodes-list', {
    episodes
  });
};


exports.showActorsList = async (req, res) => {
  try {
    const  { contentId } = req.params;
    const { episodeId } = req.query;

    const content = await Content.findById(contentId).lean();
    if (!content) {
      return res.status(404).send('Content not found');
    }

    if (content.type === 'movie' || !episodeId) {
      return res.render('partials/actors-list', {
        layout: false,
        actors: content.actors || []
      });
    }

    let episode = null;
    for (const season of content.seasons || []) {
      episode = season.episodes.find(ep => String(ep._id) === episodeId);
      if (episode) break;
    }

    if (!episode) {
      return res.status(404).send('Episode not found');
    }

    return res.render('partials/actors-list', {
      layout: false,
      actors: episode.actors || []
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal server error');
  }
};
