const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['candidat', 'formateur', 'admin'],
    default: 'candidat'
  },
  dateInscription: {
    type: Date,
    default: Date.now
  },
  progression: {
    type: Number,
    default: 0
  }
});

// Hacher le mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);