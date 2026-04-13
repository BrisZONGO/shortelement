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
    required: true
  },
  duree: {
    type: Number, // en minutes
    default: 60
  },
  niveau: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    default: 'débutant'
  },
  categorie: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cours', coursSchema);