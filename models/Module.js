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
  actif: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

moduleSchema.index({ coursId: 1, ordre: 1 });

module.exports = mongoose.model('Module', moduleSchema);