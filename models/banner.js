var mongoose = require('mongoose');
var schema = mongoose.Schema;


var bannerSchema = new schema({
  shortDescription: {type: String},
  thumb: {type: String},
  isUsing: {type: Boolean, default: false}
}, {timestamps: true});

module.exports = mongoose.model('Banner', bannerSchema);
