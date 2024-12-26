const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, //encrypted
  role: { type: String, enum: ['Admin', 'Customer', 'Receptionist', 'Stylist'], default: 'Customer' },
});

module.exports = mongoose.model('User', userSchema);
