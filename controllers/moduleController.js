const Module = require("../models/Module");
const Partie = require("../models/Partie");

// =============================
// ➕ CREATE MODULE
// =============================
exports.createModule = async (req, res) => {
  try {
    const module = await Module.create(req.body);
    res.status(201).json({ success: true, module });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 📦 GET MODULES BY COURS (FIX IMPORTANT)
// =============================
exports.getModulesByCours = async (req, res) => {
  try {
    const modules = await Module.find({ coursId: req.params.coursId });

    res.json({
      success: true,
      modules
    });

  } catch (error) {
    console.error("❌ modules:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 📄 GET MODULE + PARTIES
// =============================
exports.getModuleWithParties = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    const parties = await Partie.find({ moduleId: module._id });

    res.json({
      success: true,
      module,
      parties
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// ✏️ UPDATE MODULE
// =============================
exports.updateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.json({ success: true, module });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 🗑️ DELETE MODULE
// =============================
exports.deleteModule = async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    await Partie.deleteMany({ moduleId: req.params.id });

    res.json({ success: true, message: "Module supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};