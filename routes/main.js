var router = require('express').Router();
var i18n = require('i18n');

var News = require('../models/news');
var Banner = require('../models/banner');

router.get('/', function (req, res, cb) {
  if (req.cookies.i18n) {
  res.setLocale(req.cookies.i18n);
} else {
  res.setLocale('en');
}
Banner
.find()
.exec(function (err, banner) {
  res.render('web/index', {
    i18n: res,
    banner: banner
  })
})
});

router.get('/en', function (req, res) {
  res.cookie('i18n', 'en');
  return res.redirect('/');
});

router.get('/vi', function (req, res) {
  res.cookie('i18n', 'vi');
return res.redirect('/');
});

router.get('/news', function (req, res) {
  News
  .find()
  .exec(function (err, news) {
    res.render('web/news/newsList', {
      news: news
    })
  })
})

router.get('/news/:id', function (req, res) {
  News
  .findOne({ _id: req.params.id })
  .exec(function (err, news) {
    res.render('web/news/news', {
      news: news
    })
  })
})

module.exports = router;
