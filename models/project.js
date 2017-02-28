var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
  name: {type: String, default: '', unique:true},
  address: {type: String, default: ''},
  owner: {type: String, default: ''},
  note: {type: String, default: ''},
  updatedBy: {type: String, default: ''},
  deleted: {type: Boolean, default: false},
  deletedBy: {type: String, default: ''}
}, {timestamps: true});

module.exports = mongoose.model('Project', projectSchema);
