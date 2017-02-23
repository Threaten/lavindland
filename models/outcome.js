var mongoose = require('mongoose');
var schema = mongoose.Schema;


var outcomeSchema = new schema({
  issuedBy: { type: schema.Types.ObjectId, ref: 'User' },
  amount: {type: Number, default: 0},
  content: { type: String, default :''},
  note: { type: String, default: ''}
}, {timestamps: true});

module.exports = mongoose.model('Outcome', outcomeSchema);
