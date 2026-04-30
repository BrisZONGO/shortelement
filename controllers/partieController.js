const Partie = require("../models/Partie");

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
    ordre: typeof contenu.ordre === "number" ? contenu.ordre : index
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

// =============================
// ➕ CREATE PARTIE
// =============================
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

// =============================
// 📄 GET PARTIES BY MODULE
// =============================
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
    console.error("❌ parties:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================
// 📄 GET PARTIE BY ID
// =============================
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

// =============================
// ✏️ UPDATE PARTIE
// =============================
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

// =============================
// 🗑️ DELETE PARTIE
// =============================
exports.deletePartie = async (req, res) => {
  try {
    const partie = await Partie.findByIdAndDelete(req.params.id);

    if (!partie) {
      return res.status(404).json({
        success: false,
        message: "Partie introuvable"
      });
    }

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

// =============================
// 🔄 REORDER PARTIES
// =============================
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
