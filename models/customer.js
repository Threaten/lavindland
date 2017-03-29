var mongoose = require('mongoose');
var schema = mongoose.Schema;


var customerSchema = new schema({
  addedBy: { type: schema.Types.ObjectId, ref: 'user' },
  name: { type: String, default: " " },
  phone: { type: String, default: " " },
  address: { type: String, default: " " },
  email: { type: String, default: " " },
  dob: { type: Date, default: "01/01/1990"},
  potential: { type: Boolean, default: false},
  note: { type: String, default: " " },
  updatedBy: {type: String, default: ''},
  deleted: {type: Boolean, default: false},
  deletedBy: {type: String, default: ''},
  boughtItems: [{
    item: { type: String, default: ''},
    date: { type: Date, default: ''}
  }],
  rentedItems: [{
    item: { type: String, default: ''},
    date: { type: Date, default: ''}
  }]
}, {timestamps: true});

module.exports = mongoose.model('Customer', customerSchema);
