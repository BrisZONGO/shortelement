const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  coursId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours',
    required: true
  },
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  numeroSemaine: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  dateActivation: {
    type: Date,
    default: null
  },
  estActif: {
    type: Boolean,
    default: false
  },
  ordre: {
    type: Number,
    default: 0
  },
  dureeEstimee: {
    type: String,
    default: ''
  },
  objectifs: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour trier par semaine
moduleSchema.index({ coursId: 1, numeroSemaine: 1 });

module.exports = mongoose.model('Module', moduleSchema);