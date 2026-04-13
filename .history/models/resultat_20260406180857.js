const mongoose = require('mongoose');

const resultatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qcmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Qcm',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  scoreMax: {
    type: Number,
    required: true
  },
  reponses: [{
    questionId: Number,
    reponseDonnee: Number,
    estCorrecte: Boolean
  }],
  dateCompletion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resultat', resultatSchema);