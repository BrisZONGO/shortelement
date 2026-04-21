const mongoose = require('mongoose');

const coursSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  contenu: {
    type: String,
    default: ''
  },
  prix: {
    type: Number,
    default: 0
  },
  estPremium: {
    type: Boolean,
    default: false
  },
  actif: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
  },
  duree: {
    type: String,
    default: ''
  },
  niveau: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    default: 'débutant'
  },
  categorie: {
    type: String,
    default: 'général'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cours', coursSchema);