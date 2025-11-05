const { render } = require('ejs');
const User = require('../models/user');

const availablePages = ['home', 'movies', 'shows', 'settings'];
const pageToLayoutMap = {
    home: {
      topbarLayout: ["SEARCH", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["NOTIFICATIONS", "LOGOUT_BUTTON", "PROFILE_DROPDOWN"]
    },
    shows: {
      topbarLayout: ["SEARCH", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["NOTIFICATIONS", "LOGOUT_BUTTON", "PROFILE_DROPDOWN"]
    },
    movies: {
      topbarLayout: ["SEARCH", "TOPBAR_ACTIONS"],
      topbarActionsLayout: ["NOTIFICATIONS", "LOGOUT_BUTTON", "PROFILE_DROPDOWN"]
    },
    settings: {
      topbarLayout: ["TOPBAR_ACTIONS"],
      topbarActionsLayout: ["NOTIFICATIONS", "LOGOUT_BUTTON", "PROFILE_DROPDOWN"]
    },
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

exports.showContentMainPage = async (req, res) => {   
  const user = await User.findOne({ _id: req.session.user.id }).lean();

  res.render('pages/content-main', {
    title: 'Main - AdoraStream',
    scripts: ['contentMain'],
    additional_css: ['contentMain', 'buttons'],
    profiles: user.profiles,
    activeProfileId: req.session.user.profileId,
    topbarLayout: pageToLayoutMap['home'].topbarLayout,
    topbarActionsLayout: pageToLayoutMap['home'].topbarActionsLayout
   });
}

exports.showMainSpecificPage = async (req, res) => {
  let { page } = req.params;
  if (page === undefined || !availablePages.includes(page)) {
    page = "home";
  }
  await showPage(req, res, page, `partials/main-${page}`);
}

exports.showTopbar = async (req, res) => {
  let { page } = req.params;
  if (page === undefined || !availablePages.includes(page)) {
    page = "home";
  }
  await showPage(req, res, page, 'partials/main-topbar');
}

async function showPage(req, res, page, renderPath) {
  const user = await User.findOne({ _id: req.session.user.id }).lean();
  res.render(renderPath, {
    layout: false,
    profiles: user.profiles,
    activeProfileId: req.session.user.profileId,
    topbarLayout: pageToLayoutMap[page].topbarLayout,
    topbarActionsLayout: pageToLayoutMap[page].topbarActionsLayout
  });  
}

exports.showSettingsSpecificPage = async (req, res) => {
  const availablePages = ['manage-profiles', 'statistics'];
  let { page } = req.params;
  if (page === undefined || !availablePages.includes(page)) {
    page = "manage-profiles";
  } 

  const user = await User.findOne({ _id: req.session.user.id }).lean();

  res.render(`partials/main-settings-${page}`, {
    layout: false,
    profiles: user.profiles,
    activeProfileId: req.session.user.profileId,
  });
}

// Reach here from /settings/profiles/:action
exports.showSettingsProfileActionPage = async (req, res) => {
  const availablePages = ['add', 'edit'];
  let { action } = req.params;
  const profileIdToEdit = req.query.id;
  const user = await User.findOne({ _id: req.session.user.id }).lean();

  if ((action === undefined || !availablePages.includes(action)) || (action === "edit" && !profileIdToEdit)) {
    action = "manage-profiles";
    res.render(`partials/main-settings-${action}`, {
      layout: false,
      profiles: user.profiles,
      activeProfileId: req.session.user.profileId
    });
    return;
  }  
  
  res.render(`partials/main-settings-${action}-profile`, {
    layout: false,
    profiles: user.profiles,
    activeProfileId: req.session.user.profileId,
    profile: user.profiles.find(p => String(p._id) === String(profileIdToEdit)) || undefined
  });
}