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
  if (req.session?.user?.id) {
    return res.redirect('/profile-selection');
  }
  res.render('pages/register', {
    title: 'Login - AdoraStream',
    scripts: ['auth'] 
  });
}

exports.showProfilesPage = (req, res) => {    
  res.render('pages/profile-selection', {
    title: 'Profiles - AdoraStream',
   // scripts: ['profileSelection'],
    additional_css: ['profileSelection']
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

exports.showContentMainPage = (req, res) => {    
  res.render('pages/content-main', {
    title: 'Main - AdoraStream',
    scripts: ['contentMain, buttonCss'],
    additional_css: ['contenttMain']  });
}

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
