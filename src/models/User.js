const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, //encrypted
  role: { type: String, enum: ['Admin', 'Staff', 'Customer'], default: 'Customer' },
});

module.exports = mongoose.model('User', userSchema);
