var express = require('express');
var router = express.Router();
var passport = require('passport');
var stormpath = require('stormpath');


//Render the registration page.
router.get('/register', function(req, res) {
  if(!req.user)
      res.render('register', {title: 'Register', error: req.flash('error')[0]});
  else 
      res.redirect('/dashboard');
});

//render adding user 
router.get('/adduser', function(req, res) {

   console.log('You are trying to add new user!');
       if(!req.user)
           res.redirect('/login');
       else 
	   // get the customdata of the currently logged in user
	   // if recruiter, then store the custom data(admin flag, dbname in jade template
	   req.user.getCustomData(function(err, data) {
	      console.log("custom data:", data);
	   })
           res.render('adduser', {title: 'Add User',user: req.user,error: req.flash('error')[0]}); 
});

  
router.post('/adduser', function(req, res) {
  var givenName=req.body.givenName;
  var surname=req.body.surname;
  var username = req.body.username;
  var email=req.body.email;
  var password = req.body.password;
  var admin= "false";
  var dbname= "example1";
 
  if (!username || !password || !email || !surname || !givenName) {
      return res.render('adduser', {title: 'AddUser', error: 'Sorry, all fields are required.'});
  }

    var apiKey = new stormpath.ApiKey(
    	process.env['STORMPATH_API_KEY_ID'],
    	process.env['STORMPATH_API_KEY_SECRET']
    );
  var spClient = new stormpath.Client({ apiKey: apiKey });


  var app = spClient.getApplication(process.env['STORMPATH_APP_HREF'], function(err, app) {
    if (err) throw err;

    app.createAccount({
      givenName: givenName,
      surname: surname,
      username: username,
      email: email,
      password: password,
      //hard coded for now - read it from the current logged in user (admin) and copy 
      customData: {
        dbname:'example1',
        admin: 'false',
      },
      admin: admin,
      dbname: dbname,
    }, function (err, createdAccount) {
      if (err) {
          console.log(err);
        return res.render('adduser', {title: 'AddUser', error: err.userMessage});
      } else {
       
         res.redirect('/manageuser');
       
      }
    });
  });

});

// Register a new user to Stormpath.
router.post('/register', function(req, res) {
   console.log('_____________*********_________________************__________');
  var givenName=req.body.givenName;
  var surname=req.body.surname;
  var username = req.body.username;
  var email=req.body.email;
  var password = req.body.password;

   console.log('-----> '+givenName+' '+surname);
 //Grab user fields.
  if (!username || !password || !email || !surname || !givenName) {
    return res.render('register', {title: 'Register', error: 'Sorry, all fields are required.'});
  }

   //Initialize Stormpath client.
  var apiKey = new stormpath.ApiKey(
    process.env['STORMPATH_API_KEY_ID'],
    process.env['STORMPATH_API_KEY_SECRET']
  );
  var spClient = new stormpath.Client({ apiKey: apiKey });

  
  var app = spClient.getApplication(process.env['STORMPATH_APP_HREF'], function(err, app) {
    if (err) throw err;

    app.createAccount({
      givenName: givenName,
      surname: surname,
      username: username,
      email: email,
      password: password,
    }, function (err, createdAccount) {
      if (err) {
          console.log(err);
        return res.render('register', {title: 'Register', error: err.userMessage});
      } else {
        passport.authenticate('stormpath')(req, res, function () {
          return res.redirect('//dashboard');
        });
      }
    });
  });

});


//Render the login page.
router.get('/login', function(req, res) {
    if(!req.user)
       res.render('login', {title: 'Login', error: req.flash('error')[0]});
    else {
       req.user.getCustomData(function(err, data) {
              console.log("*** custom data:", data.admin);
       })

       console.log("*** no data ***");
       res.redirect('/dashboard'); 
    }
});


//Authenticate a user.
router.post(
  '/login',
  passport.authenticate(
    'stormpath',
    {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.',
    }
  )
);


// Logout the user, then redirect to the home page.
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});



module.exports = router;
