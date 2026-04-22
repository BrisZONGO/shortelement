const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  texte: {
    type: String,
    required: true
  },
  propositions: [{
    texte: String,
    estCorrecte: Boolean
  }],
  reponseCorrecte: {
    type: String,
    required: true
  },
  commentaire: {
    type: String,
    default: ''
  },
  explication: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 1
  }
});

const partieSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  questions: [questionSchema],
  ordre: {
    type: Number,
    default: 0
  }
});

const qcmSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  semaineIndex: {
    type: Number,
    required: true
  },
  partieIndex: {
    type: Number,
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
  parties: [partieSchema],
  seuilReussite: {
    type: Number,
    default: 80  // 80% pour réussir
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QCM', qcmSchema);