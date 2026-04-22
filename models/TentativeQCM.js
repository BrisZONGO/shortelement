const mongoose = require('mongoose');

const reponsePartieSchema = new mongoose.Schema({
  partieIndex: Number,
  partieTitre: String,
  notePartie: Number,
  reponses: [{
    questionIndex: Number,
    questionTexte: String,
    reponseDonnee: String,
    estCorrecte: Boolean,
    pointsObtenus: Number
  }]
});

const tentativeQCMSchema = new mongoose.Schema({
  qcmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QCM',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tentatives: [{
    date: {
      type: Date,
      default: Date.now
    },
    reponsesParties: [reponsePartieSchema],
    noteTotale: Number,
    noteMax: Number,
    pourcentage: Number,
    estReussi: Boolean,
    commentaires: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

tentativeQCMSchema.index({ qcmId: 1, userId: 1 });

module.exports = mongoose.model('TentativeQCM', tentativeQCMSchema);