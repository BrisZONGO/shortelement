const mongoose = require('mongoose');

const commentaireSchema = new mongoose.Schema({
  contenu: {
    type: String,
    required: [true, 'Le contenu du commentaire est requis'],
    trim: true
  },
  coursId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  note: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reponses: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    contenu: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Commentaire', commentaireSchema);