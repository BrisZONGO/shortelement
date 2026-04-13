// models/Cours.js
const mongoose = require('mongoose');

const coursSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  duree: {
    type: Number,
    required: [true, 'La durée est requise'],
    min: [1, 'La durée doit être au moins de 1 heure']
  },
  niveau: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    default: 'débutant'
  },
  prix: {
    type: Number,
    default: 0,
    min: [0, 'Le prix ne peut pas être négatif']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cours', coursSchema);