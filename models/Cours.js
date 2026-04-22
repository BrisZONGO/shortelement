const mongoose = require("mongoose");

// ======================
// QCM (P7)
// ======================
const questionSchema = new mongoose.Schema({
  question: String,
  choix: [String],
  bonneReponse: String,
  commentaire: String
});

// ======================
// PARTIE (P6)
// ======================
const partieSchema = new mongoose.Schema({
  titre: String,
  questions: [questionSchema]
});

// ======================
// SEMAINE (P5)
// ======================
const semaineSchema = new mongoose.Schema({
  titre: String,
  weekIndex: Number,
  parties: [partieSchema]
});

// ======================
// COURS
// ======================
const coursSchema = new mongoose.Schema({
  titre: String,
  description: String,
  image: String,
  estPremium: Boolean,
  prix: Number,
  startDate: Date,

  // 🔥 P3 (année dynamique)
  anneeLabel: String, // ex: 2025-2026

  semaines: [semaineSchema]

}, { timestamps: true });

module.exports = mongoose.model("Cours", coursSchema);