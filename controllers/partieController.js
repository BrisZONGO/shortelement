const Partie = require("../models/Partie");

// =============================
// ➕ CREATE PARTIE
// =============================
exports.createPartie = async (req, res) => {
  try {
    const partie = await Partie.create(req.body);
    res.status(201).json({ success: true, partie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 📄 GET PARTIES BY MODULE (FIX IMPORTANT)
// =============================
exports.getPartiesByModule = async (req, res) => {
  try {
    const parties = await Partie.find({ moduleId: req.params.moduleId });

    res.json({
      success: true,
      parties
    });

  } catch (error) {
    console.error("❌ parties:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
exports.getPartieById = async (req, res) => {
  try {
    const partie = await Partie.findById(req.params.id);
    res.json({ success: true, partie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
exports.updatePartie = async (req, res) => {
  try {
    const partie = await Partie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, partie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
exports.deletePartie = async (req, res) => {
  try {
    await Partie.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 🔄 REORDER PARTIES
// =============================
exports.reorderParties = async (req, res) => {
  try {
    const { ordre } = req.body;

    for (let i = 0; i < ordre.length; i++) {
      await Partie.findByIdAndUpdate(ordre[i], { ordre: i });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};