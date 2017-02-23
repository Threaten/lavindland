var router = require('express').Router();
var passport = require('passport');
var config = require('../configs/passport');
var crypto = require('crypto');
var async = require('async');
var mongoose = require('mongoose');

var User = require('../models/user');

var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, req.user._id + '.jpg') //Appending .jpg
  }
})

var upload = multer({ storage: storage });

/*
*/

router.get('/login', function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('users/login', { msg: req.flash('msg')});
});

router.post('/login', passport.authenticate('login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/register', function(req, res, cb) {
  res.render('users/register', {
    error: req.flash('error'),
    msg: req.flash('msg'),
    mail: req.flash('mail')
  });
});

router.post('/register', function(req, res, cb) {
  async.waterfall([
    function(callback) {

      var seed = crypto.randomBytes(20);
      var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');

      var email = req.body.email;
      var password = req.body.password;
      var name = req.body.name;
      //var image = user.avatar();
      var address = req.body.address;
      var phone = req.body.phone;


      var user = new User();

      user.email = req.body.email;
      user.password = req.body.password;
      user.name = req.body.name;
      //user.image = user.avatar();
      user.address = req.body.address;
      user.phone = req.body.phone;
      user.username = req.body.username
      //user.isVerified = false;
      user.authToken = authToken;

      User.findOne({ email: req.body.email}, function(err, userExisted) {
        if (userExisted) {
          req.flash('error', "Account with the provided Email is existed");
          //console.log(req.body.email + " is existed");
          return res.redirect('/register');
        } else {
          user.save(function(err, user) {
            if (err) return cb(err);
        //     req.flash('msg',  "An email has been sent to " + email + ". Please check your email.");
        //     req.flash('mail', email);
        //     var authenticationURL = 'https://serene-brook-72340.herokuapp.com/emailVerification/?token=' + user.authToken;
        //     sendgrid.send({
        //     to:       user.email,
        //     from:     'threaten.bussiness@gmail.com',
        //     subject:  'Please verify your account',
        //     html:     '<a target=_blank href=\"' + authenticationURL + '\">We have recently received your register at our service. To cotinue, please verify your account by clicking this link</a>'
        //     }, function(err, json) {
        //         if (err) { return console.error(err); }
        //     return res.redirect('/register');
        // });
        return res.redirect('/');
    });
  };
});

}
  ]);
});

router.get('/logout', function(req, res, cb) {
  req.logout();
  res.redirect('/');
});



module.exports = router;
