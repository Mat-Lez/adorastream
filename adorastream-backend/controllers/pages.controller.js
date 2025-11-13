const crypto = require('crypto');
const Content = require('../models/content');
const WatchHistoryController = require('../controllers/watchHistory.controller');
const StatsController = require('../controllers/stats.controller');

const { _getSortedEpisodes, getGenreSections, getContentGrid, fetchRandomizedContents, getPopularContents, getUnwatchedContents } = require('./content.controller');


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

const ENDLESS_SCROLLING_CONTENT_AMOUNT = Number(process.env.ENDLESS_SCROLLING_CONTENT_AMOUNT) || 20;
const CONTINUE_WATCHING_LIMIT = Number(process.env.CONTINUE_WATCHING_LIMIT) || 12;

async function attachContentGrid(renderOptions, typeFilter, genreFilter, filterBy, profileId) {
  const limit = ENDLESS_SCROLLING_CONTENT_AMOUNT;
  const filter = typeFilter ? { type: typeFilter } : {};
  const randomSeed = crypto.randomBytes(8).toString('hex');
  const normalizedGenre = typeof genreFilter === 'string' ? genreFilter.trim() : '';
  const normalizedFilter = typeof filterBy === 'string' ? filterBy.trim() : '';
  if (normalizedGenre) {
    filter.genres = { $in: [normalizedGenre] };
  }

  let filteredItems;
  let filteredTitle;

  if (normalizedFilter === 'popular') {
    filteredItems = await getPopularContents({ limit, typeFilter, genreFilter: normalizedGenre });
    filteredTitle = typeFilter === 'movie' ? 'Popular Movies' : 'Popular Shows';
  } else if (normalizedFilter === 'unwatched' && profileId) {
    filteredItems = await getUnwatchedContents(profileId, { limit, typeFilter, genreFilter: normalizedGenre });
    filteredTitle = typeFilter === 'movie' ? 'Unwatched Movies' : 'Unwatched Shows';
  }

  if (filteredItems) {
    const filteredCount = filteredItems.length;
    renderOptions.gridItems = filteredItems;
    renderOptions.gridTitle = filteredTitle;
    renderOptions.gridPagination = {
      page: 1,
      limit: filteredCount,
      total: filteredCount,
      type: typeFilter || '',
      randomSeed: '',
      genre: normalizedGenre,
      filterBy: normalizedFilter
    };
    return;
  }

  const { contents: gridItems, total } = await fetchRandomizedContents(filter, { limit, seed: randomSeed });

  renderOptions.gridItems = gridItems;
  renderOptions.gridTitle = typeFilter === 'movie' ? 'Movies' : 'Shows';
  renderOptions.gridPagination = {
    page: 1,
    limit,
    total,
    type: typeFilter || '',
    randomSeed,
    filterBy: normalizedFilter,
    genre: normalizedGenre
  };
}

async function attachRecommendations(renderOptions, userId, profileId) {
  try {
    renderOptions.recommendations = await StatsController.getRecommendedContent(userId, profileId);
  } catch (err) {
    console.error("Failed to attach recommendations:", err.message);
    renderOptions.recommendations = [];
  }
}

async function attachContinueWatching(renderOptions, userId, profileId) {
  renderOptions.continueWatching = [];
  if (!userId || !profileId) {
    return;
  }

  renderOptions.continueWatching = await WatchHistoryController.getContinueWatchingItems(
    userId,
    profileId,
    CONTINUE_WATCHING_LIMIT
  );
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
  renderOptions.selectedFilter = '';

  await attachGenreSections(renderOptions);
  await attachRecommendations(renderOptions, user._id, activeProfileId);
  await attachContinueWatching(renderOptions, user._id, activeProfileId);

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
    await attachRecommendations(renderOptions, user._id, activeProfileId);
    await attachContinueWatching(renderOptions, user._id, activeProfileId);
  } else if (renderOptions.topbarLayout?.includes("FILTERS")) {
    await attachGenreSections(renderOptions);
    await attachRecommendations(renderOptions, user._id, activeProfileId);
  }

  const requestedGenre = typeof req.query.genre === 'string' ? req.query.genre.trim() : '';
  const requestedFilter = typeof req.query.filterBy === 'string' ? req.query.filterBy.trim() : '';
  renderOptions.selectedGenre = requestedGenre || '';
  renderOptions.selectedFilter = requestedFilter || '';

  if (['movies', 'shows'].includes(page)) {
    const typeFilter = page === 'movies' ? 'movie' : 'series';
    await attachContentGrid(renderOptions, typeFilter, requestedGenre, requestedFilter, activeProfileId);
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
