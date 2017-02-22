var router = require('express').Router();
var i18n = require('i18n');




router.get('/', function (req, res, cb) {
  res.setLocale(req.cookies.i18n);
  res.render('main/index', {
    i18n: res
  })
});

router.get('/en', function (req, res) {
  res.cookie('i18n', 'en');
  res.redirect('/');
});

router.get('/vi', function (req, res) {
  res.cookie('i18n', 'vi');
  res.redirect('/');
});

module.exports = router;
