var mongoose = require('mongoose');
var schema = mongoose.Schema;


var productSchema = new schema({
  project: { type: schema.Types.ObjectId, ref: 'Project' },
  code: String,
  status: String,
  rooms: Number,
  area: Number,
  rentPrice: Number,
  sellPrice: Number,
  staffCommissionRent: Number,
  companyCommissionRent: Number,
  staffCommissionSell: Number,
  companyCommissionSell: Number,
  note: {type: String, default: ''},
  updatedBy: {type: String, default: ''},
  deleted: {type: Boolean, default: false},
  deletedBy: {type: String, default: ''},
  customer: { type: schema.Types.ObjectId, ref: 'Customer' },
  deposit: Number,
  sellProfit: Number,
  rentProfit: Number,
  rentExpire: Date
}, {timestamps: true});

module.exports = mongoose.model('Product', productSchema);
