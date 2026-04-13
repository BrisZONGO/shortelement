const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  texte: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  reponseCorrecte: {
    type: Number, // index de la bonne réponse (0,1,2,3)
    required: true
  },
  points: {
    type: Number,
    default: 1
  }
});

const qcmSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  coursId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours',
    required: true
  },
  questions: [questionSchema],
  duree: {
    type: Number, // en minutes
    default: 30
  },
  scoreMinimum: {
    type: Number,
    default: 10
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Qcm', qcmSchema);