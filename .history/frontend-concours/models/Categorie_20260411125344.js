const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  couleur: {
    type: String,
    default: '#007bff'
  },
  icone: {
    type: String,
    default: '📚'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Categorie', categorieSchema);