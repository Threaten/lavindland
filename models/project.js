var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
  name: {type: String, default: '', unique:true},
  address: {type: String, default: ''},
  owner: {type: String, default: ''},
  note: {type: String, default: ''}
});

module.exports = mongoose.model('Project', projectSchema);
