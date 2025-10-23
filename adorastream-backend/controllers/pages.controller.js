const User = require('../models/user');

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
    activeProfileId: req.session.user.profileId });
}

exports.showMainSpecificPage = async (req, res) => {
  const availablePages = ['home', 'movies', 'shows', 'settings'];
  const { page } = req.params;
  if (page === undefined || !availablePages.includes(page)) {
    page = "home";
  }
  const user = await User.findOne({ _id: req.session.user.id }).lean();
  res.render(`partials/main-${page}`, {
    layout: false,
    profiles: user.profiles,
    activeProfileId: req.session.user.profileId
  });
}