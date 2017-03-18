var mongoose = require('mongoose');
var schema = mongoose.Schema;


var staffCommissionSchema = new schema({
  staff: { type: schema.Types.ObjectId, ref: 'user' },
  customer: { type: schema.Types.ObjectId, ref: 'Customer' },
  amount: Number,
  content: String,
  code: String,
  area: Number,
  price: Number,
  profit: Number
}, {timestamps: true});

module.exports = mongoose.model('Scommission', staffCommissionSchema);
