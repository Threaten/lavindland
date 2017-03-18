var mongoose = require('mongoose');
var schema = mongoose.Schema;


var incomeSchema = new schema({
  issuedBy: {type: String},
  amount: {type: Number, default: 0},
  content: { type: String, default :''},
  note: { type: String, default: ''},
  updatedBy: {type: String, default: ''},
  deleted: {type: Boolean, default: false},
  deletedBy: {type: String, default: ''},
  date: {type: Date}
}, {timestamps: true});

module.exports = mongoose.model('Income', incomeSchema);
