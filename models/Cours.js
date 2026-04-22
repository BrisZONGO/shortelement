const mongoose = require("mongoose");

// ======================
// QCM (P7)
// ======================
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  choix: [{
    type: String,
    required: true
  }],
  bonneReponse: {
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

// ======================
// PARTIE (P6)
// ======================
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

// ======================
// SEMAINE (P5)
// ======================
const semaineSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  weekIndex: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  description: {
    type: String,
    default: ''
  },
  objectifs: [{
    type: String
  }],
  parties: [partieSchema],
  dateActivation: {
    type: Date,
    default: null
  },
  estActif: {
    type: Boolean,
    default: false
  }
});

// ======================
// COURS (P3 - Année académique)
// ======================
const coursSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  estPremium: {
    type: Boolean,
    default: false
  },
  prix: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  
  // 🔥 P3 - Année académique (menu déroulant)
  anneeAcademique: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/,  // Format: 2024-2025
    default: function() {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  },
  anneeCreation: {
    type: Number,
    required: true,
    default: function() {
      return new Date().getFullYear();
    }
  },
  anneeLabel: {
    type: String,
    default: function() {
      return `${this.anneeCreation}-${this.anneeCreation + 1}`;
    }
  },

  // Structure du cours
  semaines: [semaineSchema],
  
  // Métadonnées
  niveau: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    default: 'débutant'
  },
  duree: {
    type: String,
    default: ''
  },
  actif: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

// ======================
// 🔥 INDEX pour optimiser les recherches par année académique
// ======================
coursSchema.index({ anneeAcademique: 1, actif: 1 });
coursSchema.index({ anneeCreation: 1 });
coursSchema.index({ estPremium: 1 });

// ======================
// 🔥 Méthodes statiques
// ======================

// Récupérer toutes les années académiques disponibles
coursSchema.statics.getAnneesAcademiques = async function() {
  const annees = await this.distinct('anneeAcademique', { actif: true });
  return annees.sort().reverse();
};

// Récupérer les cours par année académique
coursSchema.statics.findByAnneeAcademique = async function(anneeAcademique) {
  return this.find({ anneeAcademique, actif: true })
    .sort({ createdAt: -1 });
};

// Récupérer les cours par année de création
coursSchema.statics.findByAnneeCreation = async function(annee) {
  return this.find({ anneeCreation: annee, actif: true })
    .sort({ createdAt: -1 });
};

// ======================
// 🔥 Méthodes d'instance
// ======================

// Vérifier si une semaine est accessible
coursSchema.methods.isSemaineAccessible = function(semaineIndex, dateDebutAbonnement) {
  const aujourdhui = new Date();
  const startDate = dateDebutAbonnement || this.startDate || new Date();
  const semainesEcoulees = Math.floor((aujourdhui - startDate) / (7 * 24 * 60 * 60 * 1000));
  return semaineIndex <= semainesEcoulees + 1;
};

// Obtenir la progression du cours
coursSchema.methods.getProgression = function(dateDebutAbonnement) {
  const totalSemaines = this.semaines.length;
  const aujourdhui = new Date();
  const startDate = dateDebutAbonnement || this.startDate || new Date();
  const semainesEcoulees = Math.floor((aujourdhui - startDate) / (7 * 24 * 60 * 60 * 1000));
  const semaineActuelle = Math.min(semainesEcoulees + 1, totalSemaines);
  
  return {
    totale: totalSemaines,
    debloquees: semaineActuelle,
    pourcentage: Math.round((semaineActuelle / totalSemaines) * 100)
  };
};

// ======================
// 🔥 Middleware pre-save (P3)
// ======================
coursSchema.pre('save', function(next) {
  // Générer l'année académique automatiquement si non fournie
  if (!this.anneeCreation) {
    this.anneeCreation = new Date().getFullYear();
  }
  if (!this.anneeAcademique) {
    this.anneeAcademique = `${this.anneeCreation}-${this.anneeCreation + 1}`;
  }
  if (!this.anneeLabel) {
    this.anneeLabel = this.anneeAcademique;
  }
  next();
});

module.exports = mongoose.model("Cours", coursSchema);