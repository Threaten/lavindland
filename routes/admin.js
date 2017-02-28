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
  .find({ 'deleted': false })
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
        return res.redirect('/admin/userList');
    });
  };
  });

  }
  ]);
  });



    router.get('/editUser/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
      User.findOne({ _id: req.params.id }, function(err, user) {
        res.render('admin/users/editUser',
        {
          user: user,
          error: req.flash('error'),
          msg: req.flash('OK')
        });
      });

    });

    router.post('/editUser/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
      async.waterfall([
        function(callback) {
          User.findOne({ _id: req.params.id }, function(err, user) {
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
          user.updatedBy = req.user.email;

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

    router.get('/deleteUser/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
      User.findOne({ _id: req.params.id }, function(err, user) {
        res.render('admin/users/deleteUser',
        {
          user: user,
          error: req.flash('error'),
          msg: req.flash('OK')
        });
      });

    });

    router.post('/deleteUser/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
      async.waterfall([
        function(callback) {
          User.findOne({ _id: req.params.id }, function(err, user) {
          user.deletedBy = req.user.email;
          user.deleted = true;
          user.email = user.email + "_Deleted";

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

router.get('/productList', requireGroup('staff'), function (req, res) {
  Product
    .find({ 'deleted': false})
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


router.get('/editProduct/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
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

router.post('/editProduct/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
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
      product.rentPrice = req.body.rentPrice;
      product.sellPrice = req.body.sellPrice;
      product.updatedBy = req.user.email;

      product.save(function(err) {
        if (err) {
          req.flash('error', "Error");
        }
        req.flash('OK', "Added");
        return res.redirect('/admin/productList');
      });
    });
    }
  ]);
});

router.get('/deleteProduct/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
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

router.post('/deleteProduct/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
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

      product.save(function(err) {
        if (err) {
          req.flash('error', "Error");
        }
        req.flash('OK', "Added");
        return res.redirect('/admin/productList');
      });
    });
    }
  ]);
});



/*
Project
*/

router.get('/projectList', requireGroup('staff'), function (req, res, cb) {
  Project
  .find({ 'deleted': false})
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

router.get('/editProject/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Project.findOne({ _id: req.params.id }, function(err, project) {
    res.render('admin/projects/editProject',
    {
      project: project,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editProject/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
  Project.findOne({ _id: req.params.id }, function(err, project) {
    if (err) return cb(err);
    if (req.body.name) project.name = req.body.name;
    if (req.body.address) project.address = req.body.address;
    if (req.body.owner) project.owner = req.body.owner;
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

router.get('/deleteProject/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Project.findOne({ _id: req.params.id }, function(err, project) {
    res.render('admin/projects/deleteProject',
    {
      project: project,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteProject/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
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
        project.name = project.name + "_Deleted";
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
router.get('/customerList', requireGroup('staff'), function (req, res, cb) {
  if (req.user.role == "Administrator" || req.user.role == "Sales Administrator") {
    Customer
    .find({ 'deleted': false })
    .populate('addedBy')
    .exec(function(err, customers) {
      if (err) return cb(err);
      res.render('admin/customers/customerList', {
        customers: customers
      });
    });
  } else if (req.user.role == "Sales") {
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
  customer.addedBy = req.user.email;

  customer.save(function(err) {
    if (err) {
      req.flash('error', 'Error');
      return res.redirect('/admin/addCustomer');
    }
    req.flash('OK', 'Customer added');
    return res.redirect('/admin/customerList');
  });
});


router.get('/editCustomer/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Customer.findOne({ _id: req.params.id }, function(err, customer) {
    res.render('admin/customers/editCustomer',
    {
      customer: customer,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editCustomer/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
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

router.get('/deleteCustomer/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Customer.findOne({ _id: req.params.id }, function(err, customer) {
    res.render('admin/customers/deleteCustomer',
    {
      customer: customer,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteCustomer/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
  Customer.findOne({ _id: req.params.id }, function(err, customer) {
    if (err) return cb(err);
        customer.deleted = true;
        customer.name = customer.name + "_Deleted";
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

router.get('/incomeList', requireRole("Administrator"), requireGroup('staff'), function (req, res, cb) {


    var incomeModel = mongoose.model('Income');
    incomeModel
    .find({ 'deleted': false })
    .sort( { updatedAt: -1 } )
    .populate('issuedBy')
    .exec(function (err, income) {
      if (err) return cb(err)
        res.render('admin/incomeoutcome/incomeList', {
          income: income
                });
      });
    });


router.get('/outcomeList', requireRole("Administrator"), requireGroup('staff'), function (req, res, cb) {


    var outcomeModel = mongoose.model('Outcome');
    outcomeModel
    .find({ 'deleted': false })
    .sort( { updatedAt: -1 } )
    .populate('issuedBy')
    .exec(function (err, outcome) {
      if (err) return cb(err)
        res.render('admin/incomeoutcome/outcomeList', {
          outcome: outcome
                });
      });
    });



router.get('/addIncome', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/incomeoutcome/addIncome', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addIncome', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  var income = new Income();
  income.issuedBy = req.user._id;
  income.amount = req.body.amount;
  income.content = req.body.content;

  income.save(function(err) {
    if (err) {
      req.flash('error', 'Error');
      return res.redirect('/admin/addIncome');
    }
    req.flash('OK', 'Income added');
    return res.redirect('/admin/incomeList');
  });
});

router.get('/editIncome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Income.findOne({ _id: req.params.id }, function(err, income) {
    res.render('admin/incomeoutcome/editIncome',
    {
      income: income,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editIncome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
  Income.findOne({ _id: req.params.id }, function(err, income) {
    if (err) return cb(err);
    income.amount = req.body.amount;
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

router.get('/deleteIncome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Income.findOne({ _id: req.params.id }, function(err, income) {
    res.render('admin/incomeoutcome/deleteIncome',
    {
      income: income,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteIncome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
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

router.get('/addOutcome', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  res.render('admin/incomeoutcome/addOutcome', {error: req.flash('error'), msg: req.flash('OK')});
});

router.post('/addOutcome', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  var outcome = new Outcome();
  outcome.issuedBy = req.user._id;
  outcome.amount = req.body.amount;
  outcome.content = req.body.content;

  outcome.save(function(err) {
    if (err) {
      req.flash('error', 'Error');
      return res.redirect('/admin/addOutcome');
    }
    req.flash('OK', 'Outcome added');
    return res.redirect('/admin/outcomeList');
  });
});

router.get('/editOutcome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Outcome.findOne({ _id: req.params.id }, function(err, outcome) {
    res.render('admin/incomeoutcome/editOutcome',
    {
      outcome: outcome,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/editOutcome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
  Outcome.findOne({ _id: req.params.id }, function(err, outcome) {
    if (err) return cb(err);
    outcome.amount = req.body.amount;
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

router.get('/deleteOutcome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res, cb) {
  Outcome.findOne({ _id: req.params.id }, function(err, outcome) {
    res.render('admin/incomeoutcome/deleteOutcome',
    {
      outcome: outcome,
      error: req.flash('error'),
      msg: req.flash('OK')
    });
  });

});

router.post('/deleteOutcome/:id', requireRole("Administrator"), requireGroup('staff'), function(req, res ,cb) {
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

router.get('/profit', requireRole("Administrator"), requireGroup('staff'), function (req, res, cb) {
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

router.post('/profit', requireRole("Administrator"), requireGroup('staff'), function (req, res, cb) {
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
            updatedAt: {
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
          deleted: false,
            $match: {
                updatedAt: {
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
            .find({ 'deleted': false, 'updatedAt': { $gte: new Date(req.body.fDate), $lte: new Date(req.body.tempDate) }})
            .populate('issuedBy')
            .exec(function (err, income1) {
            if (err) return cb(err);
            outcomeModel
            .find({ 'deleted': false, 'updatedAt': { $gte: new Date(req.body.fDate), $lte: new Date(req.body.tempDate) }})
            .populate('issuedBy')
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


module.exports = router;
