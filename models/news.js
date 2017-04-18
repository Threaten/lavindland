var mongoose = require('mongoose');
var schema = mongoose.Schema;


var newsSchema = new schema({
  author: {type: String},
  title: {type: String},
  shortDescription: {type: String},
  thumb: {type: String},
  content: { type: String, default :''},
  updatedBy: {type: String, default: ''},
  deleted: {type: Boolean, default: false},
  deletedBy: {type: String, default: ''},
}, {timestamps: true});

module.exports = mongoose.model('News', newsSchema);
