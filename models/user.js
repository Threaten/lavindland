var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

/* User */
var userSchema = mongoose.Schema({
  email: {type: String, unique: true, lowercase: true},
  password: String,
  name: {type: String, default: ''},
  image: {type: String, default: ''},
  address: {type: String, default: ''},
  phone: {type: String, default: ''},
  passwordResetToken: {type: String, default: ''},
  passwordResetExpires: {tyep: Date, default: ''},
  isVerified: {type: Boolean, default: false},
  authToken: {type: String, required: true, unique: true},
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: '58b641ab5757a404aa579b99' },
  group: {type: String, default: 'user', required: true},
  updatedBy: {type: String, default: ''},
  deleted: {type: Boolean, default: false},
  deletedBy: {type: String, default: ''},
  dob: {type: Date, default:'01/01/1990'}
}, {timestamps: true});

/* Password Encryption using BCrypt */
userSchema.pre('save', function(cb) {
  var user = this;

  if(!user.isModified('password')) return cb();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return cb(err);
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return cb(err);
      user.password = hash;
      cb();
    });
  });
});

/* Password Comparison */
userSchema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
}


module.exports = mongoose.model('user', userSchema);
