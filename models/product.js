var mongoose = require('mongoose');
var schema = mongoose.Schema;


var productSchema = new schema({
  project: { type: schema.Types.ObjectId, ref: 'Project' },
  code: String,
  status: String,
  rooms: Number,
  area: String,
  rentPrice: String,
  sellPrice: String,
  note: String
}, {timestamps: true});

module.exports = mongoose.model('Product', productSchema);
