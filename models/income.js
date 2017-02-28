var mongoose = require('mongoose');
var schema = mongoose.Schema;


var incomeSchema = new schema({
  issuedBy: { type: schema.Types.ObjectId, ref: 'user' },
  amount: {type: Number, default: 0},
  content: { type: String, default :''},
  note: { type: String, default: ''},
  updatedBy: {type: String, default: ''},
  deleted: {type: Boolean, default: false},
  deletedBy: {type: String, default: ''}
}, {timestamps: true});

module.exports = mongoose.model('Income', incomeSchema);
