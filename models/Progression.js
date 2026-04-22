const mongoose = require("mongoose");

const progressionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  coursId: { type: mongoose.Schema.Types.ObjectId, ref: "Cours" },

  semaineIndex: Number,
  partieIndex: Number,

  score: Number,
  tentatives: { type: Number, default: 0 },

  validated: Boolean
}, { timestamps: true });

module.exports = mongoose.model("Progression", progressionSchema);