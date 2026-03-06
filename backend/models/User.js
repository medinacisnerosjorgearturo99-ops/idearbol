const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // En un proyecto real esto se encripta
  initials: { type: String }
}, { timestamps: true }); // timestamps crea automáticamente 'createdAt' y 'updatedAt'

module.exports = mongoose.model('User', userSchema);