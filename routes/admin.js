var router = require('express').Router();
var async = require('async');
var crypto = require('crypto');

var User = require('../models/user');
var Project = require('../models/project');
var Product = require('../models/product');
var Customer = require('../models/customer');


function requireGroup(group) {
  return function(req, res, next) {
    if(req.user && req.user.group == group)
    next();
    else
    res.sendStatus(403);
  }
}

function requireRole(role) {
  return function(req, res, next) {
    if(req.user && req.user.role == role)
    next();
    else
    res.sendStatus(403);
  }
}

router.get('/', requireGroup("staff"), function (req, res, cb) {
  res.setLocale(req.cookies.i18n);
  res.render('admin/dashboard/index', {
    i18n: res
  })
});

router.get('/en', function (req, res) {
  res.cookie('i18n', 'en');
  return res.redirect(req.get('referer'));
});

router.get('/vi', function (req, res) {
  res.cookie('i18n', 'vi');
  return res.redirect(req.get('referer'));
});

router.get('/userList', requireGroup("staff"), function (req, res, cb) {
  User
  .find()
  .exec(function(err, users) {
    if (err) return cb(err);
    res.render('admin/users/userList', {
      users: users
    });
  });
});

router.get('/addUser',requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/users/addUser', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addUser', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  async.waterfall([
    function(callback) {

      var user = new User();
      user.name = req.body.name;
      user.email = req.body.email;
      user.address = req.body.address;
      user.phone = req.body.phone;
      user.group = "staff";
      user.role = req.body.role;
      user.password = req.body.password;
      user.isVerified = true;
      var seed = crypto.randomBytes(20);
      var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');
      user.authToken = authToken;

      User.findOne({ email: req.body.email}, function(err, userExisted) {
        if (userExisted) {
          req.flash('error', "Account with the provided Email is existed");
          //console.log(req.body.email + " is existed");
          return res.redirect('/admin/addUser');
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
        return res.redirect('/admin/userList');
    });
  };
  });

  }
  ]);
  });


/*
Products
*/

router.get('/productList', requireGroup('staff'), function (req, res) {
  Product
    .find()
    .populate('project')
    .exec(function(err, products) {

      if (err) return cb(err);
      res.render('admin/products/productList', {
        products: products,
      });
    });
})

router.get('/addProduct/', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Project
  .find()
  .exec(function(err, project) {
    res.render('admin/products/addProduct.ejs',
    {
      project: project,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });
});

router.post('/addProduct/', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
      async.waterfall([

        function(result) {
          console.log(req.body.rooms);
          Project.findOne({ name: req.body.name }, function(err, project)  {
            if (err) return cb(err);
            result(null, project);
          });
        },
        function(project, result) {
          var product = new Product();
          product.project = project._id;
          if (req.body.code) product.code = req.body.code;
          product.status = "Available";
          product.rooms = req.body.rooms;
          product.area = req.body.area;
          product.rentPrice = req.body.rentPrice;
          product.sellPrice = req.body.sellPrice;

          product.save(function(err) {
            if (err) {
              req.flash('error', "Error");
            }
            req.flash('OK', "Added");
            return res.redirect('/admin/addProduct');
          });
        }
      ]);
});

/*
Project
*/

router.get('/projectList', requireGroup('staff'), function (req, res, cb) {
  Project
  .find()
  .exec(function(err, projects) {
    if (err) return cb(err);
    res.render('admin/projects/projectsList', {
      projects: projects,
    });
  });
});

router.get('/addProject',requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/projects/addProject', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addProject', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  var project = new Project();
  project.name = req.body.name;
  project.address = req.body.address;
  project.owner = req.body.owner;

  project.save(function(err) {
    if (err) {
      req.flash('error', 'Duplicated Project');
      console.log(err);
      return res.redirect('/admin/addProject');
    }
    req.flash('OK', 'Project added');
    console.log("OK");
    return res.redirect('/admin/projectList');
  });
});



/*
Customers
*/
router.get('/customerList', requireGroup('staff'), function (req, res, cb) {
  if (req.user.role == "Administrator" || req.user.role == "Sales Administrator") {
    Customer
    .find()
    .populate('user')
    .exec(function(err, customers) {
      if (err) return cb(err);
      res.render('admin/customers/customerList', {
        customers: customers
      });
    });
  } else if (req.user.role == "Sales") {
    Customer
    .find({ addedBy: req.user._id})
    .populate('user')
    .exec(function(err, customers) {
      if (err) return cb(err);
      res.render('admin/customers/customerList', {
        customers: customers
      });
    });
  }

});

router.get('/addCustomer', requireGroup('staff'), function(req, res, cb) {
  res.render('admin/customers/addCustomer', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addCustomer', requireGroup('staff'), function(req, res, cb) {
  var customer = new Customer();
  customer.name = req.body.name;
  customer.address = req.body.address;
  customer.email = req.body.email;
  customer.phone = req.body.phone;
  customer.dob = req.body.dob;
  if (req.body.havePotential) {
    customer.potential = true;
  } else {
    customer.potential = false;
  }
  customer.addedBy = req.user._id;

  customer.save(function(err) {
    if (err) {
      req.flash('error', 'Error');
      return res.redirect('/admin/addCustomer');
    }
    req.flash('OK', 'Customer added');
    return res.redirect('/admin/customerList');
  });
});




/*
Income
*/
router.get('/finance', requireGroup('staff'), function (req, res, cb) {

    if (req.user.role == "Administrator" || req.user.role == "Sales Administrator") {
      Customer
      .find()
      .populate('user')
      .exec(function(err, customers) {
        if (err) return cb(err);
        res.render('admin/incomeoutcome/incomeoutcomeList', {
          customers: customers
        });
      });
    } else if (req.user.role == "Sales") {
      Customer
      .find({ addedBy: req.user._id})
      .populate('user')
      .exec(function(err, customers) {
        if (err) return cb(err);
        res.render('admin/incomeoutcome/incomeoutcomeList', {
          customers: customers
        });
      });
    }

});



module.exports = router;
