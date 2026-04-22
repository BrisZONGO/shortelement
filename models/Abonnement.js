const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['6_mois', '9_mois', '12_mois'],
    required: true
  },
  dureeMois: {
    type: Number,
    required: true
  },
  prix: {
    type: Number,
    required: true
  },
  dateDebut: {
    type: Date,
    default: Date.now
  },
  dateFin: {
    type: Date,
    required: true
  },
  statut: {
    type: String,
    enum: ['actif', 'expire', 'annule'],
    default: 'actif'
  },
  montantPaye: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour les recherches
abonnementSchema.index({ userId: 1, statut: 1 });
abonnementSchema.index({ dateFin: 1 });

module.exports = mongoose.model('Abonnement', abonnementSchema);