var mongoose = require('mongoose');
var schema = mongoose.Schema;


var companyCommissionSchema = new schema({
  amount: Number,
  content: String
}, {timestamps: true});

module.exports = mongoose.model('Ccommission', companyCommissionSchema);
