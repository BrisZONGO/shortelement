const mongoose = require('mongoose');

const partieSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
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
  contenu: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['video', 'document', 'qcm', 'exercice', 'ressource'],
    default: 'document'
  },
  url: {
    type: String,
    default: ''
  },
  duree: {
    type: String,
    default: ''
  },
  ordre: {
    type: Number,
    default: 0
  },
  ressources: [{
    titre: String,
    url: String,
    type: String
  }],
  estGratuit: {
    type: Boolean,
    default: false
  },
  actif: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

partieSchema.index({ moduleId: 1, ordre: 1 });

module.exports = mongoose.model('Partie', partieSchema);