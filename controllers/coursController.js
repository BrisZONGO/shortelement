const Cours = require('../models/Cours');
const Progression = require("../models/Progression");
const { isUnlocked } = require("../utils/unlock");

// =============================
// 📚 GET TOUS LES COURS
// =============================
const getAllCours = async (req, res) => {
  try {
    const cours = await Cours.find({ actif: { $ne: false } })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: cours.length,
      cours
    });
  } catch (error) {
    console.error("❌ Erreur getAllCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 📘 GET COURS AVEC SEMAINES DÉBLOQUÉES
// =============================
const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);

    if (!cours) {
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé"
      });
    }

    // 🔓 Gestion unlock sécurisée
    const semaines = (cours.semaines || []).map((week) => ({
      ...week._doc,
      unlocked: isUnlocked(
        week.weekIndex || 0,
        cours.startDate || cours.createdAt
      )
    }));

    res.json({
      success: true,
      cours: {
        ...cours._doc,
        semaines
      }
    });

  } catch (error) {
    console.error("❌ Erreur getCoursById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 💎 COURS PREMIUM
// =============================
const getCoursPremium = async (req, res) => {
  try {
    const coursPremium = await Cours.find({
      estPremium: true,
      actif: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: coursPremium.length,
      cours: coursPremium,
      abonnement: req.abonnement || null
    });
  } catch (error) {
    console.error("❌ Erreur getCoursPremium:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cours premium"
    });
  }
};

// =============================
// 🆓 COURS GRATUITS
// =============================
const getCoursGratuits = async (req, res) => {
  try {
    const coursGratuits = await Cours.find({
      estPremium: false,
      actif: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: coursGratuits.length,
      cours: coursGratuits
    });
  } catch (error) {
    console.error("❌ Erreur getCoursGratuits:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cours gratuits"
    });
  }
};

// =============================
// 👑 CREATE COURS
// =============================
const createCours = async (req, res) => {
  try {
    const {
      titre,
      description,
      duree,
      niveau,
      prix,
      estPremium,
      image,
      categorie,
      semaines,
      startDate,
      anneeAcademique
    } = req.body;

    if (!titre || !description) {
      return res.status(400).json({
        success: false,
        message: "Titre et description obligatoires"
      });
    }

    const cours = new Cours({
      titre,
      description,
      duree: duree || 0,
      niveau: niveau || "débutant",
      prix: prix || 0,
      estPremium: estPremium || false,
      image,
      categorie,
      semaines: semaines || [],
      startDate: startDate || new Date(),
      anneeAcademique,
      actif: true,
      createdBy: req.userId
    });

    await cours.save();

    res.status(201).json({
      success: true,
      message: "Cours créé avec succès",
      cours
    });

  } catch (error) {
    console.error("❌ Erreur createCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// ✏️ UPDATE COURS
// =============================
const updateCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!cours) {
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé"
      });
    }

    res.json({
      success: true,
      message: "Cours mis à jour",
      cours
    });

  } catch (error) {
    console.error("❌ Erreur updateCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 🗑️ DELETE COURS (soft delete)
// =============================
const deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndUpdate(
      req.params.id,
      { actif: false },
      { new: true }
    );

    if (!cours) {
      return res.status(404).json({
        success: false,
        message: "Cours non trouvé"
      });
    }

    res.json({
      success: true,
      message: "Cours supprimé (désactivé)"
    });

  } catch (error) {
    console.error("❌ Erreur deleteCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 🔍 SEARCH
// =============================
const searchCours = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: true, cours: [] });
    }

    const cours = await Cours.find({
      actif: true,
      $or: [
        { titre: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      count: cours.length,
      cours
    });

  } catch (error) {
    console.error("❌ Erreur searchCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 🧠 QCM (CORRIGÉ + SÉCURISÉ)
// =============================
const submitQCM = async (req, res) => {
  try {
    const { coursId, semaineIndex, partieIndex, score } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    let progression = await Progression.findOne({
      userId: req.userId,
      coursId,
      semaineIndex,
      partieIndex
    });

    if (!progression) {
      progression = new Progression({
        userId: req.userId,
        coursId,
        semaineIndex,
        partieIndex,
        tentatives: 0
      });
    }

    progression.score = score;
    progression.tentatives += 1;

    // 🔥 Règle validation
    progression.validated = score >= 80 || progression.tentatives >= 2;

    await progression.save();

    res.json({
      success: true,
      validated: progression.validated,
      tentatives: progression.tentatives
    });

  } catch (error) {
    console.error("❌ Erreur submitQCM:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 📤 EXPORT
// =============================
module.exports = {
  getAllCours,
  getCoursById,
  getCoursPremium,
  getCoursGratuits,
  createCours,
  updateCours,
  deleteCours,
  searchCours,
  submitQCM
};