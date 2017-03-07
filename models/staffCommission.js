var mongoose = require('mongoose');
var schema = mongoose.Schema;


var staffCommissionSchema = new schema({
  staff: { type: schema.Types.ObjectId, ref: 'user' },
  amount: Number,
  content: String
}, {timestamps: true});

module.exports = mongoose.model('Scommission', staffCommissionSchema);
