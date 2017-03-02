var mongoose = require('mongoose');
var schema = mongoose.Schema;

var roleSchema = new schema({
  role: {type: String, unique: 'true'},
  isManager: {type: Boolean, default: false},
  permission: [{
    name: {type: String}
  }]
}, {timestamps: true});

module.exports = mongoose.model('Role', roleSchema);
