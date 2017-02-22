var router = require('express').Router();
var async = require('async');

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
  res.redirect('/admin/');
});

router.get('/vi', function (req, res) {
  res.cookie('i18n', 'vi');
  res.redirect('/admin/');
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
      console.log("failed");
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
        customers: customers,
      });
    });
  } else if (req.user.role == "Sales") {
    Customer
    .find({ addedBy: req.user._id})
    .populate('user')
    .exec(function(err, customers) {
      if (err) return cb(err);
      res.render('admin/customers/customerList', {
        customers: customers,
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

module.exports = router;
