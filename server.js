var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var ejsmate = require('ejs-mate');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('express-flash');
var connectMongo = require('connect-mongo/es5')(session);
var passport = require('passport');
var i18n = require('i18n');
//var cart = require('./middlewares/middlewares');
var server = require('http').Server(app);

//config
var config = require('./configs/config');

// //schema
// var History = require('./models/history');
var User = require('./models/user');
// var Category = require('./models/category');

var app = express();

i18n.configure({
  locales: ['en', 'vi'],
  directory: __dirname + '/locales',
  defaultLocale: 'en',
  cookie: 'i18n'
});

mongoose.connect(config.database, {server: {socketOptions: { connectTimeoutMS: 100000000}}}, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected");
  }
});

/* Middleware */
app.use(express.static(__dirname + '/'));
//Morgan
app.use(morgan('dev'));
//Body Parser
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true,parameterLimit: 1000000}));
app.use(cookieParser());
app.use(i18n.init);
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.key,
  store: new connectMongo({ url: config.database, autoReconnect: true})
}));
app.use(flash());
//passport
app.use(passport.initialize());
app.use(passport.session());
//globalize user variable
app.use(function(req, res, cb) {
  res.locals.user = req.user;
  cb();
});
//cart middleware
//app.use(cart);
//
//ejs
app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');

//Routes
var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');

app.use(mainRoutes);
app.use(userRoutes);
app.use('/admin', adminRoutes);



// // development error handler
// // will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }
//
// // production error handler
// // no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });

app.listen(process.env.PORT || 5000, function(err) {
  if (err) throw err;
  console.log("Server is running on port " + config.port);
});

// server.listen(process.env.PORT || 5000, function(err) {
//   if (err) throw err;
//   console.log("Server is running on port " + config.port);
// });
