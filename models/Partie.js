const mongoose = require("mongoose");

const questionQCMSchema = new mongoose.Schema(
  {
    texte: { type: String, default: "" },
    propositions: [{ type: String }],
    bonneReponse: { type: String, default: "" },
    commentaire: { type: String, default: "" },
    explication: { type: String, default: "" },
    points: { type: Number, default: 1 }
  },
  { _id: false }
);

const contenuSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["document", "video", "qcm", "exercice", "reponse", "ressource"],
      required: true
    },
    titre: { type: String, default: "" },
    texte: { type: String, default: "" },
    url: { type: String, default: "" },
    fichierUrl: { type: String, default: "" },
    fichierNom: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    extension: { type: String, default: "" },
    ordre: { type: Number, default: 0 },
    questions: [questionQCMSchema],
    pointsMax: { type: Number, default: 0 }
  },
  { _id: false }
);

const partieSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true
  },
  titre: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  contenu: {
    type: String,
    default: ""
  },
  type: {
    type: String,
    enum: ["video", "document", "qcm", "exercice", "reponse", "ressource"],
    default: "document"
  },
  url: {
    type: String,
    default: ""
  },
  typesDisponibles: [{
    type: String,
    enum: ["video", "document", "qcm", "exercice", "reponse", "ressource"]
  }],
  contenus: [contenuSchema],
  duree: {
    type: String,
    default: ""
  },
  ordre: {
    type: Number,
    default: 0
  },
  estGratuit: {
    type: Boolean,
    default: false
  },
  actif: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

partieSchema.index({ moduleId: 1, ordre: 1 });

module.exports = mongoose.model("Partie", partieSchema);

