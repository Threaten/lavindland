var router = require('express').Router();
var async = require('async');
var crypto = require('crypto');
var mongoose = require('mongoose');

var User = require('../models/user');
var Project = require('../models/project');
var Product = require('../models/product');
var Customer = require('../models/customer');
var Income = require('../models/income');
var Outcome = require('../models/outcome');
var Role = require('../models/role');
var SCommission = require('../models/staffCommission');
var CCommission = require('../models/companyCommission');

var permissions = [];
var roleName;
var isManager;

function requireGroup(group) {
  return function(req, res, next) {
    if(req.user && req.user.group == group)
    next();
    else
    res.sendStatus(403);
  }
}

function requireRole() {
  return function(req, res, next) {
    async.waterfall([
      function (result) {
        Role.findOne({ _id: req.user.role }, function (err, role) {
          // var permissions = [];
          // var roleName;
          // var isManager;

          for (var i =0; i < role.permission.length; i++) {
            permissions.push(role.permission[i].name);
          }

          roleName = role.role;
          isManager = role.isManager;
          result(null, permissions);

        })
      },
      function (permissions, result) {
        console.log(permissions);
        if(permissions.indexOf('/'+req.path.split('/')[1]) > -1) {
          next();
        } else {
          res.sendStatus(403);
        }
      }
    ])

    // console.log(permissions);
    // console.log(roleName);
    // console.log(isManager);
  }
}

// function test() {
//   return function(req, res, next) {
//   var a = ['/addProduct', '/editProduct'];
//     if(a.indexOf('/'+req.path.split('/')[1]) > -1) {
//       next();
//     } else {
//       res.sendStatus(403);
//     }
//   }
// }

router.get('/', requireGroup("staff"), function (req, res, cb) {

  res.setLocale(req.cookies.i18n);
  res.render('admin/dashboard/index', {
    i18n: res
  })
});

router.get('/en', function (req, res) {
  res.cookie('i18n', 'en');
  //return res.redirect(req.get('referer'));
  return res.redirect('/admin/');
});

router.get('/vi', function (req, res) {
  res.cookie('i18n', 'vi');
  //return res.redirect(req.get('referer'));
  return res.redirect('/admin/');
});

router.get('/userList',requireRole(), requireGroup("staff"), function (req, res, cb) {
  //var ObjectId = require('mongodb').ObjectID;
  User
  .find({ 'deleted': false, 'email': { $not:   /^threaten.business@gmail.com.*/ }})
  .populate('role')
  .exec(function(err, users) {
    if (err) return cb(err);
    console.log(isManager);
    res.render('admin/users/userList', {
      roleName: roleName,
      users: users
    });
  });
});

router.get('/addUser',requireRole(), requireGroup('staff'), function(req, res, cb) {
  Role
  .find({ 'role': { $not:   /^System Administrator.*/  }})
  .exec(function (err, roles) {
    res.render('admin/users/addUser', {roles: roles, error: req.flash('error'), msg: req.flash('OK')});
  })
});

router.post('/addUser', requireRole(), requireGroup('staff'), function(req, res, cb) {
  async.waterfall([
    function (result) {
      Role.findOne({ role: req.body.role }, function (err, roles) {
        if (err) return cb(err);
        result(null, roles);
      });
    },
    function(roles, result) {

      var user = new User();
      user.role = roles._id;
      user.name = req.body.name;
      user.email = req.body.email;
      user.address = req.body.address;
      user.dob = req.body.dob;
      user.phone = req.body.phone;
      user.group = "staff";
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
            return res.redirect('/admin/userList');
          });
        };
      });

    }
  ]);
});



router.get('/editUser/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Role
  .find()
  .exec(function (err, roles) {
    User
    .findOne({ _id: req.params.id })
    .populate('role')
    .exec(function(err, user) {
      res.render('admin/users/editUser',
      {
        roles: roles,
        user: user,
        error: req.flash('error'),
        msg: req.flash('OK')
      });
    });
  });
});

router.post('/editUser/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  async.waterfall([
    function (result) {
      Role.findOne({ role: req.body.role }, function (err, roles) {
        if (err) return cb(err);
        result(null, roles);
      });
    },
    function(roles, result) {
      User.findOne({ _id: req.params.id }, function(err, user) {
        user.role = roles._id;
        user.name = req.body.name;
        user.email = req.body.email;
        user.address = req.body.address;
        user.dob = req.body.dob;
        user.phone = req.body.phone;
        user.group = "staff";
        user.isVerified = true;
        var seed = crypto.randomBytes(20);
        var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');
        user.authToken = authToken;

        user.save(function(err) {
          if (err) {
            req.flash('error', "Account with the provided Email is existed.");
            return res.redirect(req.get('referer'));

          }
          req.flash('OK', "Added");
          return res.redirect('/admin/userList');
        });
      });
    }
  ]);
});

router.get('/deleteUser/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Role
  .find()
  .exec(function (err, roles) {
    User
    .findOne({ _id: req.params.id })
    .populate('role')
    .exec(function(err, user) {
      res.render('admin/users/deleteUser',
      {
        roles: roles,
        user: user,
        error: req.flash('error'),
        msg: req.flash('OK')
      });
    });
  });
});

router.post('/deleteUser/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  async.waterfall([
    function(callback) {
      User.findOne({ _id: req.params.id }, function(err, user) {
        var seed = crypto.randomBytes(20);
        var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');
        user.deletedBy = req.user.email;
        user.deleted = true;
        user.email = user.email + "_Deleted" + "_"+authToken;

        User.findOne({ _id: req.body._id}, function(err, userExisted) {
          if (userExisted) {
            req.flash('error', "Account with the provided Email is existed");
            //console.log(req.body.email + " is existed");
            return res.redirect(req.get('referer'));
          } else {
            user.save(function(err, user) {
              if (err) {
                req.flash('error', "Account with the provided Email is existed");
                return cb(err);
              }
              return res.redirect('/admin/userList');
            });
          };
        });
      });
    }
  ]);
});


/*
Products
*/

router.get('/productList', requireRole(),requireGroup('staff'), function (req, res) {
  Product
  .find({ 'deleted': false})
  .populate('project')
  .populate('customer')
  .exec(function(err, products) {
    if (err) return cb(err);
    res.render('admin/products/productList', {
      products: products,
    });
  });
})

router.get('/addProduct/', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project
  .find({ 'deleted': false})
  .exec(function(err, project) {
    res.render('admin/products/addProduct.ejs',
    {
      project: project,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });
});

router.post('/addProduct/',  requireRole(), requireGroup('staff'), function(req, res, cb) {
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
      product.rentPrice = req.body.rentPrice*1000000;
      product.sellPrice = req.body.sellPrice*1000000000;
      product.staffCommissionRent = req.body.rentCommissionStaff;
      product.companyCommissionRent = req.body.rentCommissionCompany;
      product.staffCommissionSell = req.body.sellCommissionStaff;
      product.companyCommissionSell = req.body.sellCommissionCompany;
      product.sellProfit = req.body.sellProfit*1000000;
      product.rentProfit = req.body.rentProfit*1000000;

      product.save(function(err) {
        if (err) {

          req.flash('error', "Error");
          return res.redirect(req.get('referer'));

        }
        req.flash('OK', "Added");
        return res.redirect('/admin/addProduct');
      });
    }
  ]);
});


router.get('/editProduct/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project
  .find({ 'deleted': false})
  .exec(function(err, projects) {
    Product
    .findOne({ _id: req.params.id })
    .populate('project')
    .exec(function(err, product) {
      res.render('admin/products/editProduct',
      {
        projects: projects,
        product: product,
        error: req.flash('error'),
        msg: req.flash('OK')
      });
    });
  });
});

router.post('/editProduct/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  async.waterfall([

    function(result) {
      Project.findOne({ name: req.body.name }, function(err, project)  {
        if (err) return cb(err);
        result(null, project);
      });
    },
    function(project, result) {
      Product.findOne({ _id: req.params.id }, function(err, product) {
        product.project = project._id;
        if (req.body.code) product.code = req.body.code;
        product.status = "Available";
        product.rooms = req.body.rooms;
        product.area = req.body.area;
        product.rentPrice = req.body.rentPrice*1000000;
        product.sellPrice = req.body.sellPrice*1000000000;
        product.staffCommissionRent = req.body.rentCommissionStaff;
        product.companyCommissionRent = req.body.rentCommissionCompany;
        product.staffCommissionSell = req.body.sellCommissionStaff;
        product.companyCommissionSell = req.body.sellCommissionCompany;
        product.sellProfit = req.body.sellProfit*1000000;
        product.rentProfit = req.body.rentProfit*1000000;
        product.updatedBy = req.user.email;

        product.save(function(err) {
          if (err) {
            req.flash('error', "Error");
            return res.redirect(req.get('referer'));

          }
          req.flash('OK', "Added");
          return res.redirect('/admin/productList');
        });
      });
    }
  ]);
});

router.get('/deleteProduct/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project
  .find({ 'deleted': false})
  .exec(function(err, projects) {
    Product
    .findOne({ _id: req.params.id })
    .populate('project')
    .exec(function(err, product) {
      res.render('admin/products/deleteProduct',
      {
        projects: projects,
        product: product,
        error: req.flash('error'),
        msg: req.flash('OK')
      });
    });
  });
});

router.post('/deleteProduct/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  async.waterfall([

    function(result) {
      Project.findOne({ name: req.body.name }, function(err, project)  {
        if (err) return cb(err);
        result(null, project);
      });
    },
    function(project, result) {
      Product.findOne({ _id: req.params.id }, function(err, product) {
        product.deletedBy = req.user.email;
        product.deleted = true;
        var seed = crypto.randomBytes(20);
        var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');
        product.name = product.name + "_Deleted" + "_"+authToken;
        product.save(function(err) {
          if (err) {
            req.flash('error', "Error");
            return res.redirect(req.get('referer'));

          }
          req.flash('OK', "Added");
          return res.redirect('/admin/productList');
        });
      });
    }
  ]);
});



router.get('/depositProduct/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project
  .find({ 'deleted': false})
  .exec(function(err, projects) {
    Product
    .findOne({ _id: req.params.id })
    .populate('project')
    .exec(function(err, product) {
      if (isManager) {
        Customer
        .find({ 'deleted': false})
        .exec(function(err, customers) {
          if (product.status == "Available"){
          res.render('admin/products/depositProduct',
          {
            customers: customers,
            projects: projects,
            product: product,
            error: req.flash('error'),
            msg: req.flash('OK')
          });
        } else {
          res.render('admin/products/notAvailable');
        }
        });
      } else {
        Customer
        .find({ 'deleted': false, 'addedBy': req.user._id})
        .exec(function(err, customers) {
          if (product.status == "Available"){
          res.render('admin/products/depositProduct',
          {
            customers: customers,
            projects: projects,
            product: product,
            error: req.flash('error'),
            msg: req.flash('OK')
          });
        } else {
          res.render('admin/products/notAvailable');
        }
        });
      }
    });
  });
});

router.post('/depositProduct/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  async.waterfall([

    function(result) {
      Customer.findOne({ _id: req.body.cus }, function(err, customer)  {
        if (err) return cb(err);
        result(null, customer);
      });
    },
    function(customer, result) {
      Product.findOne({ _id: req.params.id }, function(err, product) {
        product.customer = customer._id;
        product.status = "Deposited";
        product.updatedBy = req.user.email;
        product.deposit = req.body.depositPrice*1000000;
        product.save(function(err) {
          if (err) {
            req.flash('error', "Error");
            console.log(err);
            return res.redirect(req.get('referer'));

          }
          req.flash('OK', "Added");
          return res.redirect('/admin/productList');
        });
      });
    }
  ]);
});


router.get('/cancelDepositProduct/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {


      Product.findOne({ _id: req.params.id }, function(err, product) {
        product.status = "Available";
        product.updatedBy = req.user.email;
        product.deposit = 0
        product.save(function(err) {
          if (err) {
            req.flash('error', "Error");
            console.log(err);
            return res.redirect(req.get('referer'));

          }
          req.flash('OK', "Added");
          return res.redirect('/admin/productList');
        });
      });
});

/*
*/

router.get('/sellProduct/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project
  .find({ 'deleted': false})
  .exec(function(err, projects) {
    Product
    .findOne({ _id: req.params.id })
    .populate('project')
    .exec(function(err, product) {
      if (isManager) {
        Customer
        .find({ 'deleted': false})
        .exec(function(err, customers) {
          if (product.status == "Available"){
            res.render('admin/products/sellProduct',
            {
              customers: customers,
              projects: projects,
              product: product,
              error: req.flash('error'),
              msg: req.flash('OK')
            });
          } else {
            res.render('admin/products/notAvailable');
          }
        });
      } else {
        Customer
        .find({ 'deleted': false, 'addedBy': req.user._id})
        .exec(function(err, customers) {
          if (product.status == "Available"){
            res.render('admin/products/sellProduct',
            {
              customers: customers,
              projects: projects,
              product: product,
              error: req.flash('error'),
              msg: req.flash('OK')
            });
          } else {
            res.render('admin/products/notAvailable');

          }
        });
      }
    });
  });
});

router.post('/sellProduct/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  async.waterfall([

    function(result) {
      Customer.findOne({ _id: req.body.cus }, function(err, customer)  {
        if (err) return cb(err);
        result(null, customer);
      });
    },
    function(customer, result) {
      Product.findOne({ _id: req.params.id }, function(err, product) {
        if (product.status != "Available") {
          res.render('admin/products/notAvailable');
        } else {
        product.customer = customer._id;
        product.status = "Sold";
        product.updatedBy = req.user.email;
        product.save(function(err) {
          if (err) {
            req.flash('error', "Error");
            console.log(err);
            return res.redirect(req.get('referer'));
          }
          var sCommission = new SCommission();
          sCommission.staff = req.user._id;
          sCommission.customer = customer._id;
          sCommission.area = product.area;
          sCommission.code = product.code;
          sCommission.profit = product.sellProfit;
          sCommission.price = product.sellPrice;
          sCommission.amount = product.sellProfit*product.staffCommissionSell/100;
          sCommission.save(function (err) {
            if (err) return cb(err);
          })
          var cCommission = new CCommission();
          cCommission.customer = customer._id;
          cCommission.area = product.area;
          cCommission.code = product.code;
          cCommission.profit = product.sellProfit;
          cCommission.price = product.sellPrice;
          cCommission.amount = product.sellProfit*product.companyCommissionSell/100;
          cCommission.save(function (err) {
            if (err) return cb(err);
              return res.redirect('/admin/productList')

          })
        })
      }
    })
  }
  ]);
});

router.get('/rentProduct/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project
  .find({ 'deleted': false})
  .exec(function(err, projects) {
    Product
    .findOne({ _id: req.params.id })
    .populate('project')
    .exec(function(err, product) {
      if (isManager) {
        Customer
        .find({ 'deleted': false})
        .exec(function(err, customers) {
          if (product.status == "Available"){
            res.render('admin/products/rentProduct',
            {
              customers: customers,
              projects: projects,
              product: product,
              error: req.flash('error'),
              msg: req.flash('OK')
            });
          } else {
            res.render('admin/products/notAvailable');
          }
        });
      } else {
        Customer
        .find({ 'deleted': false, 'addedBy': req.user._id})
        .exec(function(err, customers) {
          if (product.status == "Available"){
            res.render('admin/products/rentProduct',
            {
              customers: customers,
              projects: projects,
              product: product,
              error: req.flash('error'),
              msg: req.flash('OK')
            });
          } else {
            res.render('admin/products/notAvailable');

          }
        });
      }
    });
  });
});

router.post('/rentProduct/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  async.waterfall([

    function(result) {
      Customer.findOne({ _id: req.body.cus }, function(err, customer)  {
        if (err) return cb(err);
        result(null, customer);
      });
    },
    function(customer, result) {
      Product.findOne({ _id: req.params.id }, function(err, product) {
        if (product.status != "Available") {
          res.render('admin/products/notAvailable');
        } else {
        product.customer = customer._id;
        product.status = "Rented";
        product.updatedBy = req.user.email;
        product.save(function(err) {
          if (err) {
            req.flash('error', "Error");
            console.log(err);
            return res.redirect(req.get('referer'));
          }
          var sCommission = new SCommission();
          sCommission.staff = req.user._id;
          sCommission.customer = customer._id;
          sCommission.area = product.area;
          sCommission.code = product.code;
          sCommission.profit = product.rentProfit;
          sCommission.price = product.rentPrice;
          sCommission.amount = product.rentProfit*product.staffCommissionRent/100;
          sCommission.save(function (err) {
            if (err) return cb(err);
          })
          var cCommission = new CCommission();
          cCommission.customer = customer._id;
          cCommission.area = product.area;
          cCommission.code = product.code;
          cCommission.profit = product.rentProfit;
          cCommission.price = product.rentPrice;
          cCommission.amount = product.rentProfit*product.companyCommissionRent/100;
          cCommission.save(function (err) {
            if (err) return cb(err);
              return res.redirect('/admin/productList')

          })
        })
      }
    })
  }
  ]);
});

/*
Project
*/

router.get('/projectList',requireRole(), requireGroup('staff'), function (req, res, cb) {
  Project
  .find({ 'deleted': false})
  .exec(function(err, projects) {
    if (err) return cb(err);
    res.render('admin/projects/projectsList', {
      projects: projects,
    });
  });
});

router.get('/addProject',requireRole(), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/projects/addProject', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addProject', requireRole(), requireGroup('staff'), function(req, res, cb) {
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

router.get('/editProject/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project.findOne({ _id: req.params.id }, function(err, project) {
    res.render('admin/projects/editProject',
    {
      project: project,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editProject/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Project.findOne({ _id: req.params.id }, function(err, project) {
    if (err) return cb(err);
    if (req.body.name) project.name = req.body.name;
    if (req.body.address) project.address = req.body.address;
    if (req.body.owner) project.owner = req.body.owner;
    if (req.body.note) {
      project.note = req.body.note;
    } else {
      project.note = '';
    }

    project.updatedBy = req.user.email;
    project.save(function(err) {
      if (err) {
        req.flash('error', 'Duplicated project');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "project edited");
      return res.redirect('/admin/projectList');
    });
  });
});

router.get('/deleteProject/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Project.findOne({ _id: req.params.id }, function(err, project) {
    res.render('admin/projects/deleteProject',
    {
      project: project,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteProject/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Project.findOne({ _id: req.params.id }, function(err, project) {
    if (err) return cb(err);
    Product.find({ project: req.params.id }, function (err, products) {
      if (err) return cb(err);
      if (products.length > 0) {
        console.log(products.length)
        req.flash('error', 'Project contains Products. Cannot delete');
        return res.redirect(req.get('referer'));
      } else {
        project.deleted = true;
        var seed = crypto.randomBytes(20);
        var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');
        project.name = project.name + "_Deleted" + "_"+authToken;
        project.deletedBy = req.user.email;
        project.save(function(err) {
          if (err) {
            req.flash('error', 'Duplicated project');
            return res.redirect(req.get('referer'));
          }
          req.flash('OK', "Project Deleted");
          return res.redirect('/admin/projectList');
        });
      }
    });

  });
});


/*
Customers
*/
router.get('/customerList', requireRole(),requireGroup('staff'), function (req, res, cb) {
  if (isManager) {
    Customer
    .find({ 'deleted': false })
    .populate('addedBy')
    .exec(function(err, customers) {
      if (err) return cb(err);
      res.render('admin/customers/customerList', {
        customers: customers
      });
    });
  } else {
    Customer
    .find({ addedBy: req.user._id})
    .populate('addedBy')
    .exec(function(err, customers) {
      if (err) return cb(err);
      res.render('admin/customers/customerList', {
        customers: customers
      });
    });
  }

});

router.get('/addCustomer',requireRole(), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/customers/addCustomer', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addCustomer', requireRole(),requireGroup('staff'), function(req, res, cb) {
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
      console.log(err);
      req.flash('error', 'Error');
      return res.redirect('/admin/addCustomer');
    }
    req.flash('OK', 'Customer added');
    return res.redirect('/admin/customerList');
  });
});


router.get('/editCustomer/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Customer.findOne({ _id: req.params.id }, function(err, customer) {
    res.render('admin/customers/editCustomer',
    {
      customer: customer,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editCustomer/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Customer.findOne({ _id: req.params.id }, function(err, customer) {
    if (err) return cb(err);
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
    customer.updatedBy = req.user.email;
    customer.save(function(err) {
      if (err) {
        req.flash('error', 'Duplicated Customer');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "Customer edited");
      return res.redirect('/admin/customerList');
    });
  });
});

router.get('/deleteCustomer/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Customer.findOne({ _id: req.params.id }, function(err, customer) {
    res.render('admin/customers/deleteCustomer',
    {
      customer: customer,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteCustomer/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Customer.findOne({ _id: req.params.id }, function(err, customer) {
    if (err) return cb(err);
    customer.deleted = true;
    var seed = crypto.randomBytes(20);
    var authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');
    customer.name = customer.name + "_Deleted" + "_"+authToken;
    customer.deletedBy = req.user.email;
    customer.save(function(err) {
      if (err) {
        req.flash('error', 'Duplicated Customer');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "Customer Deleted");
      return res.redirect('/admin/customerList');
    });

  });

});



/*
Income
*/
// router.get('/finance', requireGroup('staff'), function (req, res, cb) {
//
//
//     var incomeModel = mongoose.model('Income');
//     var outcomeModel = mongoose.model('Outcome');
//
//     incomeModel
//     .find()
//     .sort( { updatedAt: -1 } )
//     .populate('issuedBy')
//     .exec(function (err, income) {
//       if (err) return cb(err)
//       outcomeModel
//       .find()
//       .sort( { updatedAt: -1 } )
//       .populate('issuedBy')
//       .exec(function (err, outcome) {
//         if(err) return cb(err);
//         res.render('admin/incomeoutcome/incomeoutcomeList', {
//           income: income,
//           outcome: outcome
//         });
//       });
//     });
// });

router.get('/incomeList', requireRole(), requireGroup('staff'), function (req, res, cb) {


  var incomeModel = mongoose.model('Income');
  incomeModel
  .find({ 'deleted': false })
  .sort( { date: -1 } )
  .exec(function (err, income) {
    if (err) return cb(err)
    res.render('admin/incomeoutcome/incomeList', {
      income: income
    });
  });
});


router.get('/outcomeList', requireRole(), requireGroup('staff'), function (req, res, cb) {


  var outcomeModel = mongoose.model('Outcome');
  outcomeModel
  .find({ 'deleted': false })
  .sort( { date: -1 } )
  .exec(function (err, outcome) {
    if (err) return cb(err)
    res.render('admin/incomeoutcome/outcomeList', {
      outcome: outcome
    });
  });
});



router.get('/addIncome', requireRole(), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/incomeoutcome/addIncome', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addIncome', requireRole(), requireGroup('staff'), function(req, res, cb) {
  var income = new Income();
  income.issuedBy = req.user.email;
  income.amount = req.body.amount*1000000;
  income.content = req.body.content;
  if (req.body.date) {
    income.date = req.body.date;
  } else {
    income.date = Date.now();
  }
  income.save(function(err) {
    if (err) {
      req.flash('error', 'Error');
      return res.redirect('/admin/addIncome');
    }
    req.flash('OK', 'Income added');
    return res.redirect('/admin/incomeList');
  });
});

router.get('/editIncome/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Income.findOne({ _id: req.params.id }, function(err, income) {
    res.render('admin/incomeoutcome/editIncome',
    {
      income: income,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editIncome/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Income.findOne({ _id: req.params.id }, function(err, income) {
    if (err) return cb(err);
    income.amount = req.body.amount*1000000;
    income.content = req.body.content;
    income.updatedBy = req.user.email;
    income.save(function(err) {
      if (err) {
        req.flash('error', 'Duplicated Income');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "Income edited");
      return res.redirect('/admin/incomeList');
    });
  });
});

router.get('/deleteIncome/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Income.findOne({ _id: req.params.id }, function(err, income) {
    res.render('admin/incomeoutcome/deleteIncome',
    {
      income: income,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteIncome/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Income.findOne({ _id: req.params.id }, function(err, income) {
    if (err) return cb(err);
    income.deleted = true;
    income.deletedBy = req.user.email;
    income.save(function(err) {
      if (err) {
        req.flash('error', 'Error');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "Income deleted");
      return res.redirect('/admin/incomeList');
    });
  });
});




/*
Outcome
*/

router.get('/addOutcome', requireRole(), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/incomeoutcome/addOutcome', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addOutcome', requireRole(), requireGroup('staff'), function(req, res, cb) {
  var outcome = new Outcome();
  outcome.issuedBy = req.user.email;
  outcome.amount = req.body.amount*1000000;
  outcome.content = req.body.content;
  if (req.body.date) {
    outcome.date = req.body.date;
  } else {
    outcome.date = Date.now();
  }
  outcome.save(function(err) {
    if (err) {
      req.flash('error', 'Error');
      return res.redirect('/admin/addOutcome');
    }
    req.flash('OK', 'Outcome added');
    return res.redirect('/admin/outcomeList');
  });
});

router.get('/editOutcome/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Outcome.findOne({ _id: req.params.id }, function(err, outcome) {
    res.render('admin/incomeoutcome/editOutcome',
    {
      outcome: outcome,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editOutcome/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Outcome.findOne({ _id: req.params.id }, function(err, outcome) {
    if (err) return cb(err);
    outcome.amount = req.body.amount*1000000;
    outcome.content = req.body.content;
    outcome.updatedBy = req.user.email;
    outcome.save(function(err) {
      if (err) {
        req.flash('error', 'Duplicated Outcome');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "Outcome edited");
      return res.redirect('/admin/outcomeList');
    });
  });
});

router.get('/deleteOutcome/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  Outcome.findOne({ _id: req.params.id }, function(err, outcome) {
    res.render('admin/incomeoutcome/deleteOutcome',
    {
      outcome: outcome,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteOutcome/:id', requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Outcome.findOne({ _id: req.params.id }, function(err, outcome) {
    if (err) return cb(err);
    outcome.deleted = true;
    outcome.deletedBy = req.user.email;
    outcome.save(function(err) {
      if (err) {
        req.flash('error', 'Error');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "Outcome deleted");
      return res.redirect('/admin/outcomeList');
    });
  });
});

/*
Profit
*/

router.get('/financeReport', requireRole(), requireGroup('staff'), function (req, res, cb) {
  var totalIncome;
  var totalOutcome;
  var incomeTransaction;
  var outcomeTransaction;
  var balance;
  var totalTransaction;
  var income1;
  var outcome1;
  var fDate;
  var tDate;

  res.render('admin/incomeoutcome/profitByDate', {
    incomeTransaction: incomeTransaction,
    outcomeTransaction: outcomeTransaction,
    totalIncome: totalIncome,
    totalOutcome: totalOutcome,
    balance: balance,
    totalTransaction: totalTransaction,
    income1: income1,
    outcome1: outcome1,
    fDate: fDate,
    tDate: tDate

  });
});

router.post('/financeReport', requireRole(), requireGroup('staff'), function (req, res, cb) {
  var totalIncome;
  var totalOutcome;
  var incomeTransaction;
  var outcomeTransaction;
  var balance;
  var totalTransaction;
  var incomeModel = mongoose.model('Income');
  var outcomeModel = mongoose.model('Outcome');
  var fDate = new Date(req.body.fDate)
  var tDate = new Date(req.body.tDate)
  Income.aggregate(
    [{
      $match: {
        deleted: false,
        date: {
          $gte: new Date(req.body.fDate),
          $lte: new Date(req.body.tempDate)
        }
      }
    }, {
      $group: {
        _id: null,
        Total: {
          $sum: "$amount"
        },
        NoOfTransactions: {
          $sum: 1
        }
      }
    }], function (err, income) {
      totalIncome = income[0].Total;
      Outcome.aggregate(
        [{
          $match: {
            deleted: false,
            date: {
              $gte: new Date(req.body.fDate),
              $lte: new Date(req.body.tempDate)
            }
          }
        }, {
          $group: {
            _id: null,
            Total: {
              $sum: "$amount"
            },
            NoOfTransactions: {
              $sum: 1
            }
          }
        }], function (err, outcome) {
          incomeModel
          .find({ 'deleted': false, 'date': { $gte: new Date(req.body.fDate), $lte: new Date(req.body.tempDate) }})
          .exec(function (err, income1) {
            if (err) return cb(err);
            outcomeModel
            .find({ 'deleted': false, 'date': { $gte: new Date(req.body.fDate), $lte: new Date(req.body.tempDate) }})
            .exec(function (err, outcome1) {
              if(err) return cb(err);
              incomeTransaction = income[0].NoOfTransactions;
              outcomeTransaction = outcome[0].NoOfTransactions;
              totalIncome = income[0].Total;
              totalOutcome = outcome[0].Total;
              balance = totalIncome - totalOutcome;
              totalTransaction = incomeTransaction + outcomeTransaction;
              res.render('admin/incomeoutcome/profitByDate', {
                incomeTransaction: incomeTransaction,
                outcomeTransaction: outcomeTransaction,
                totalIncome: totalIncome,
                totalOutcome: totalOutcome,
                balance: balance,
                totalTransaction: totalTransaction,
                income1: income1,
                outcome1: outcome1,
                fDate: fDate,
                tDate: tDate
              });
            });
          });
        }
      )
    }
  )

})



/*
ROLES
*/

router.get('/roleList', requireRole(), requireGroup('staff'), function (req, res, cb) {
  Role
  .find( { 'role': { $not:   /^System.*/ } })
  .exec(function (err, roles) {
    res.render('admin/roles/roleList', {
      roles: roles
    });
  })
});

router.get('/addRole',requireRole(), requireGroup('staff'), function (req, res, cb) {
  res.render('admin/roles/addRole', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addRole', requireRole(), requireGroup('staff'), function (req, res, cb) {
  var name = req.body.name;
  var permission = [];
  async.waterfall([
    function(result) {
      var role = new Role();


      if (req.body.canViewUser) {
        permission.push('/userList');
      }
      if (req.body.canAddUser) {
        permission.push('/addUser');
      }
      if (req.body.canEditUser) {
        permission.push('/editUser');
      }
      if (req.body.canDeleteUser) {
        permission.push('/deleteUser');
      }
      /*
      */
      if (req.body.canViewCustomer) {
        permission.push('/customerList');
      }
      if (req.body.canAddCustomer) {
        permission.push('/addCustomer');
      }
      if (req.body.canEditCustomer) {
        permission.push('/editCustomer');
      }
      if (req.body.canDeleteCustomer) {
        permission.push('/deleteCustomer');
      }
      /*
      */
      if (req.body.canViewProject) {
        permission.push('/projectList');
      }
      if (req.body.canAddProject) {
        permission.push('/addProject');
      }
      if (req.body.canEditProject) {
        permission.push('/editProject');
      }
      if (req.body.canDeleteProject) {
        permission.push('/deleteProject');
      }
      /*
      */
      if (req.body.canViewProduct) {
        permission.push('/productList');
      }
      if (req.body.canAddProduct) {
        permission.push('/addProduct');
      }
      if (req.body.canEditProduct) {
        permission.push('/editProduct');
      }
      if (req.body.canDeleteProduct) {
        permission.push('/deleteProduct');
      }
      if (req.body.canSellProduct) {
        permission.push('/sellProduct');
      }
      if (req.body.canRentProduct) {
        permission.push('/rentProduct');
      }
      if (req.body.canDepositProduct) {
        permission.push('/depositProduct');
      }
      if (req.body.canCancelDepositProduct) {
        permission.push('/cancelDepositProduct');
      }
      /*
      */
      if (req.body.canViewIncome) {
        permission.push('/incomeList');
      }
      if (req.body.canAddIncome) {
        permission.push('/addIncome');
      }
      if (req.body.canEditIncome) {
        permission.push('/editIncome');
      }
      if (req.body.canDeleteIncome) {
        permission.push('/deleteIncome');
      }
      /*
      */
      if (req.body.canViewOutcome) {
        permission.push('/outcomeList');
      }
      if (req.body.canAddOutcome) {
        permission.push('/addOutcome');
      }
      if (req.body.canEditOutcome) {
        permission.push('/editOutcome');
      }
      if (req.body.canDeleteOutcome) {
        permission.push('/deleteOutcome');
      }
      if (req.body.canViewFinanceReport) {
        permission.push('/financeReport');
      }
      /*
      */
      if (req.body.canViewRole) {
        permission.push('/roleList');
      }
      if (req.body.canAddRole) {
        permission.push('/addRole');
      }
      if (req.body.canEditRole) {
        permission.push('/editRole');
      }
      if (req.body.canDeleteRole) {
        permission.push('/deleteRole');
      }
      if (req.body.canViewCommission) {
        permission.push('/staffCommission');
        permission.push('/companyCommission');
      }
      if (req.body.isManager) {
        role.isManager = true;
      } else {
        role.isManager = false;
      }
      role.role = name;
      //  role.permission.push({
      //  name: {$each : permission }
      // });
      role.save(function (err) {
        if (err) return cb(err);
        result(null, role);
      });
    }, function (role, result) {
      Role.findOne({ role : name}, function (err, role1) {
        for (var i = 0; i < permission.length; i++) {
          role1.permission.push({
            name: permission[i]
          });
        }
        role1.save(function (err) {
          if (err) return cb(err);
          res.redirect('/admin/roleList')
        })
      })
    }
  ]);
});

router.get('/editRole/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  var permissions1 = [];
  Role.findOne({ _id: req.params.id }, function(err, role) {
    for (var i =0; i < role.permission.length; i++) {
      permissions1.push(role.permission[i].name);
    }
    res.render('admin/roles/editRole',
    {
      permissions1: permissions1,
      role: role,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editRole/:id', requireRole(), requireGroup('staff'), function (req, res, cb) {
  var name = req.body.name;
  var permission = [];
  async.waterfall([
    function(result) {
      if (req.body.canViewUser) {
        permission.push('/userList');
      }
      if (req.body.canAddUser) {
        permission.push('/addUser');
      }
      if (req.body.canEditUser) {
        permission.push('/editUser');
      }
      if (req.body.canDeleteUser) {
        permission.push('/deleteUser');
      }
      /*
      */
      if (req.body.canViewCustomer) {
        permission.push('/customerList');
      }
      if (req.body.canAddCustomer) {
        permission.push('/addCustomer');
      }
      if (req.body.canEditCustomer) {
        permission.push('/editCustomer');
      }
      if (req.body.canDeleteCustomer) {
        permission.push('/deleteCustomer');
      }
      /*
      */
      if (req.body.canViewProject) {
        permission.push('/projectList');
      }
      if (req.body.canAddProject) {
        permission.push('/addProject');
      }
      if (req.body.canEditProject) {
        permission.push('/editProject');
      }
      if (req.body.canDeleteProject) {
        permission.push('/deleteProject');
      }
      /*
      */
      if (req.body.canViewProduct) {
        permission.push('/productList');
      }
      if (req.body.canAddProduct) {
        permission.push('/addProduct');
      }
      if (req.body.canEditProduct) {
        permission.push('/editProduct');
      }
      if (req.body.canDeleteProduct) {
        permission.push('/deleteProduct');
      }
      if (req.body.canSellProduct) {
        permission.push('/sellProduct');
      }
      if (req.body.canRentProduct) {
        permission.push('/rentProduct');
      }
      if (req.body.canDepositProduct) {
        permission.push('/depositProduct');
      }
      if (req.body.canCancelDepositProduct) {
        permission.push('/cancelDepositProduct');
      }
      /*
      */
      if (req.body.canViewIncome) {
        permission.push('/incomeList');
      }
      if (req.body.canAddIncome) {
        permission.push('/addIncome');
      }
      if (req.body.canEditIncome) {
        permission.push('/editIncome');
      }
      if (req.body.canDeleteIncome) {
        permission.push('/deleteIncome');
      }
      /*
      */
      if (req.body.canViewOutcome) {
        permission.push('/outcomeList');
      }
      if (req.body.canAddOutcome) {
        permission.push('/addOutcome');
      }
      if (req.body.canEditOutcome) {
        permission.push('/editOutcome');
      }
      if (req.body.canDeleteOutcome) {
        permission.push('/deleteOutcome');
      }
      if (req.body.canViewFinanceReport) {
        permission.push('/financeReport');
      }
      /*
      */
      if (req.body.canViewRole) {
        permission.push('/roleList');
      }
      if (req.body.canAddRole) {
        permission.push('/addRole');
      }
      if (req.body.canEditRole) {
        permission.push('/editRole');
      }
      if (req.body.canDeleteRole) {
        permission.push('/deleteRole');
      }
      if (req.body.canViewCommission) {
        permission.push('/staffCommission');
        permission.push('/companyCommission');
      }
      Role.findOne({ role : name}, function (err, role) {
        role.permission = [];
        //  role.permission.push({
        //  name: {$each : permission }
        // });
        role.save(function (err) {
          if (err) return cb(err);
          result(null, role);
        });
      })
    }, function (role, result) {
      Role.findOne({ role : name}, function (err, role1) {
        for (var i = 0; i < permission.length; i++) {
          role1.permission.push({
            name: permission[i]
          });
          if (req.body.isManager) {
            role.isManager = true;
          } else {
            role.isManager = false;
          }
          role.role = name;
        }
        role1.save(function (err) {
          if (err) return cb(err);
          res.redirect('/admin/roleList')
        })
      })
    }
  ]);
});

router.get('/deleteRole/:id', requireRole(), requireGroup('staff'), function(req, res, cb) {
  var permissions1 = [];
  Role.findOne({ _id: req.params.id }, function(err, role) {
    for (var i =0; i < role.permission.length; i++) {
      permissions1.push(role.permission[i].name);
    }
    res.render('admin/roles/deleteRole',
    {
      permissions1: permissions1,
      role: role,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteRole/:id',requireRole(), requireGroup('staff'), function(req, res ,cb) {
  Role.findOne({ _id: req.params.id }, function(err, role) {
    if (err) return cb(err);
    role.remove(function(err) {
      if (err) {
        req.flash('error', 'Error');
        return res.redirect(req.get('referer'));
      }
      req.flash('OK', "Role deleted");
      return res.redirect('/admin/roleList');
    });

  });
});


/*
Commission
*/
router.get('/staffCommission', requireRole(), requireGroup('staff'), function (req, res, cb) {
  SCommission
  .find()
  .populate('staff')
  .populate('customer')
  .exec(function (err, staffCommission) {
    res.render('admin/commission/staffCommission', {
      staffCommission: staffCommission
    })
  })
})

router.get('/companyCommission', requireRole(), requireGroup('staff'), function (req, res, cb) {
  CCommission
  .find()
  .populate('customer')
  .exec(function (err, companyCommission) {
    res.render('admin/commission/companyCommission', {
      companyCommission: companyCommission
    })
  })
})


module.exports = router;
