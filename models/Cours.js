const mongoose = require('mongoose');

const coursSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duree: {
    type: Number,
    required: true
  },
  niveau: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    default: 'débutant'
  },
  prix: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cours', coursSchema);
