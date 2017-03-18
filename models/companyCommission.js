var mongoose = require('mongoose');
var schema = mongoose.Schema;


var companyCommissionSchema = new schema({
  customer: { type: schema.Types.ObjectId, ref: 'Customer' },
  amount: Number,
  content: String,
  code: String,
  area: Number,
  price: Number,
  profit: Number
}, {timestamps: true});

module.exports = mongoose.model('Ccommission', companyCommissionSchema);
