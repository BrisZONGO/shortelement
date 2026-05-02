const Partie = require("../models/Partie");
const TentativeSousModule = require("../models/TentativeSousModule");

const normalizeQuestions = (questions = []) => {
  if (!Array.isArray(questions)) return [];

  return questions.map((question) => ({
    texte: (question.texte || "").trim(),
    propositions: Array.isArray(question.propositions)
      ? question.propositions.map((p) => (p || "").trim()).filter(Boolean)
      : [],
    bonneReponse: (question.bonneReponse || "").trim(),
    commentaire: (question.commentaire || "").trim(),
    explication: (question.explication || "").trim(),
    points: Number(question.points || 1)
  }));
};

const normalizeContenus = (contenus = []) => {
  if (!Array.isArray(contenus)) return [];

  return contenus.map((contenu, index) => ({
    kind: contenu.kind,
    titre: (contenu.titre || "").trim(),
    texte: (contenu.texte || "").trim(),
    url: (contenu.url || "").trim(),
    fichierUrl: (contenu.fichierUrl || "").trim(),
    fichierNom: (contenu.fichierNom || "").trim(),
    mimeType: (contenu.mimeType || "").trim(),
    extension: (contenu.extension || "").trim(),
    ordre: typeof contenu.ordre === "number" ? contenu.ordre : index,
    questions: normalizeQuestions(contenu.questions),
    pointsMax: Number(contenu.pointsMax || 0)
  }));
};

const buildPayload = (body) => {
  const typesDisponibles = Array.isArray(body.typesDisponibles)
    ? body.typesDisponibles
    : body.type
    ? [body.type]
    : [];

  const contenus = normalizeContenus(body.contenus);

  return {
    moduleId: body.moduleId,
    titre: (body.titre || "").trim(),
    description: (body.description || "").trim(),
    contenu: (body.contenu || "").trim(),
    type: body.type || typesDisponibles[0] || "document",
    url: (body.url || "").trim(),
    typesDisponibles,
    contenus,
    duree: (body.duree || "").trim(),
    ordre: Number.isFinite(Number(body.ordre)) ? Number(body.ordre) : 0,
    ressources: Array.isArray(body.ressources) ? body.ressources : [],
    estGratuit: Boolean(body.estGratuit),
    actif: body.actif !== undefined ? Boolean(body.actif) : true
  };
};

const shouldUnlockResponses = (pourcentage, tentativeNumero) => {
  if (pourcentage >= 80) return true;
  if (tentativeNumero >= 2) return true;
  return false;
};

exports.createPartie = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const partie = await Partie.create(payload);

    res.status(201).json({
      success: true,
      partie
    });
  } catch (error) {
    console.error("❌ createPartie:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPartiesByModule = async (req, res) => {
  try {
    const parties = await Partie.find({
      moduleId: req.params.moduleId,
      actif: true
    }).sort({ ordre: 1, createdAt: 1 });

    res.json({
      success: true,
      parties
    });
  } catch (error) {
    console.error("❌ getPartiesByModule:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPartieById = async (req, res) => {
  try {
    const partie = await Partie.findById(req.params.id);

    if (!partie) {
      return res.status(404).json({
        success: false,
        message: "Partie introuvable"
      });
    }

    res.json({
      success: true,
      partie
    });
  } catch (error) {
    console.error("❌ getPartieById:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updatePartie = async (req, res) => {
  try {
    const payload = buildPayload(req.body);

    const partie = await Partie.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!partie) {
      return res.status(404).json({
        success: false,
        message: "Partie introuvable"
      });
    }

    res.json({
      success: true,
      partie
    });
  } catch (error) {
    console.error("❌ updatePartie:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deletePartie = async (req, res) => {
  try {
    const partie = await Partie.findByIdAndDelete(req.params.id);

    if (!partie) {
      return res.status(404).json({
        success: false,
        message: "Partie introuvable"
      });
    }

    await TentativeSousModule.deleteMany({ partieId: req.params.id });

    res.json({
      success: true,
      message: "Partie supprimée"
    });
  } catch (error) {
    console.error("❌ deletePartie:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.reorderParties = async (req, res) => {
  try {
    const { ordre } = req.body;

    if (!Array.isArray(ordre)) {
      return res.status(400).json({
        success: false,
        message: "Le champ ordre doit être un tableau"
      });
    }

    for (let i = 0; i < ordre.length; i += 1) {
      await Partie.findByIdAndUpdate(ordre[i], { ordre: i });
    }

    res.json({
      success: true,
      message: "Ordre mis à jour"
    });
  } catch (error) {
    console.error("❌ reorderParties:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.submitTraitementPartie = async (req, res) => {
  try {
    const partie = await Partie.findById(req.params.id);

    if (!partie) {
      return res.status(404).json({
        success: false,
        message: "Partie introuvable"
      });
    }

    const userId = req.user.id;
    const submittedResults = Array.isArray(req.body.resultats) ? req.body.resultats : [];

    const previousAttemptsCount = await TentativeSousModule.countDocuments({
      partieId: partie._id,
      userId
    });

    const tentativeNumero = previousAttemptsCount + 1;

    const resultats = [];
    let noteTotale = 0;
    let noteMaxTotale = 0;

    const contenusCorrigeables = (partie.contenus || []).filter(
      (contenu) =>
        contenu.kind === "qcm" ||
        contenu.kind === "exercice" ||
        contenu.kind === "document" ||
        contenu.kind === "video" ||
        contenu.kind === "ressource"
    );

    contenusCorrigeables.forEach((contenu, contenuIndex) => {
      const submitted = submittedResults.find((r) => r.contenuIndex === contenuIndex) || {};
      const noteObtenue = Number(submitted.noteObtenue || 0);

      const noteMax =
        contenu.kind === "qcm"
          ? (contenu.questions || []).reduce((sum, q) => sum + Number(q.points || 1), 0)
          : Number(contenu.pointsMax || submitted.noteMax || 1);

      resultats.push({
        contenuIndex,
        kind: contenu.kind,
        titre: contenu.titre,
        noteObtenue,
        noteMax,
        reponseUtilisateur: submitted.reponseUtilisateur || null,
        fichierReponseUrl: submitted.fichierReponseUrl || "",
        fichierReponseNom: submitted.fichierReponseNom || "",
        mimeType: submitted.mimeType || "",
        extension: submitted.extension || ""
      });

      noteTotale += noteObtenue;
      noteMaxTotale += noteMax;
    });

    const pourcentage = noteMaxTotale > 0
      ? Math.round((noteTotale / noteMaxTotale) * 100)
      : 0;

    const estReussi = pourcentage >= 80;
    const reponsesDebloquees = shouldUnlockResponses(pourcentage, tentativeNumero);

    const tentative = await TentativeSousModule.create({
      partieId: partie._id,
      userId,
      tentativeNumero,
      resultats,
      noteTotale,
      noteMaxTotale,
      pourcentage,
      estReussi,
      reponsesDebloquees
    });

    res.status(201).json({
      success: true,
      message: "Traitement enregistré",
      tentative: {
        id: tentative._id,
        tentativeNumero,
        noteTotale,
        noteMaxTotale,
        pourcentage,
        estReussi,
        reponsesDebloquees
      }
    });
  } catch (error) {
    console.error("❌ submitTraitementPartie:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTentativesPartieForUser = async (req, res) => {
  try {
    const tentatives = await TentativeSousModule.find({
      partieId: req.params.id,
      userId: req.user.id
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      tentatives
    });
  } catch (error) {
    console.error("❌ getTentativesPartieForUser:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCorrectionPartie = async (req, res) => {
  try {
    const partie = await Partie.findById(req.params.id);

    if (!partie) {
      return res.status(404).json({
        success: false,
        message: "Partie introuvable"
      });
    }

    const tentatives = await TentativeSousModule.find({
      partieId: partie._id,
      userId: req.user.id
    }).sort({ createdAt: 1 });

    const lastTentative = tentatives[tentatives.length - 1];
    const canSeeResponses =
      lastTentative &&
      (lastTentative.pourcentage >= 80 || tentatives.length >= 2);

    if (!canSeeResponses) {
      return res.status(403).json({
        success: false,
        message: "Les réponses seront visibles après 80% ou à partir de la deuxième tentative"
      });
    }

    const corrections = (partie.contenus || [])
      .filter(
        (contenu) =>
          contenu.kind === "qcm" ||
          contenu.kind === "exercice" ||
          contenu.kind === "reponse"
      )
      .map((contenu, contenuIndex) => ({
        contenuIndex,
        kind: contenu.kind,
        titre: contenu.titre,
        texte: contenu.texte,
        questions: contenu.questions || []
      }));

    res.json({
      success: true,
      tentativesCount: tentatives.length,
      lastScore: lastTentative?.pourcentage || 0,
      corrections
    });
  } catch (error) {
    console.error("❌ getCorrectionPartie:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

