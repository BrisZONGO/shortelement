const mongoose = require("mongoose");

const itemResultSchema = new mongoose.Schema(
  {
    contenuIndex: Number,
    kind: String,
    titre: String,
    noteObtenue: {
      type: Number,
      default: 0
    },
    noteMax: {
      type: Number,
      default: 0
    },
    reponseUtilisateur: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    fichierReponseUrl: {
      type: String,
      default: ""
    },
    fichierReponseNom: {
      type: String,
      default: ""
    },
    mimeType: {
      type: String,
      default: ""
    },
    extension: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const tentativeSousModuleSchema = new mongoose.Schema(
  {
    partieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partie",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tentativeNumero: {
      type: Number,
      required: true
    },
    resultats: [itemResultSchema],
    noteTotale: {
      type: Number,
      default: 0
    },
    noteMaxTotale: {
      type: Number,
      default: 0
    },
    pourcentage: {
      type: Number,
      default: 0
    },
    estReussi: {
      type: Boolean,
      default: false
    },
    reponsesDebloquees: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

tentativeSousModuleSchema.index(
  { partieId: 1, userId: 1, tentativeNumero: 1 },
  { unique: true }
);

module.exports = mongoose.model("TentativeSousModule", tentativeSousModuleSchema);
