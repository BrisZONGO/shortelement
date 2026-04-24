const Cours = require('../models/Cours');

// Récupérer tous les cours
const getAllCours = async (req, res) => {
  try {
    const cours = await Cours.find().sort({ createdAt: -1 });
    res.json({ success: true, count: cours.length, cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer un cours par ID
const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    res.json({ success: true, cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer un cours
const createCours = async (req, res) => {
  try {
    const cours = new Cours(req.body);
    await cours.save();
    res.status(201).json({ success: true, message: 'Cours créé', cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour un cours
const updateCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cours) return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    res.json({ success: true, message: 'Cours mis à jour', cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un cours
const deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndDelete(req.params.id);
    if (!cours) return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    res.json({ success: true, message: 'Cours supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recherche de cours
const searchCours = async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? { titre: { $regex: q, $options: 'i' } } : {};
    const cours = await Cours.find(query);
    res.json({ success: true, count: cours.length, cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cours premium
const getCoursPremium = async (req, res) => {
  try {
    const cours = await Cours.find({ estPremium: true, actif: true });
    res.json({ success: true, count: cours.length, cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cours gratuits
const getCoursGratuits = async (req, res) => {
  try {
    const cours = await Cours.find({ estPremium: false, actif: true });
    res.json({ success: true, count: cours.length, cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCours,
  getCoursById,
  createCours,
  updateCours,
  deleteCours,
  searchCours,
  getCoursPremium,
  getCoursGratuits
};
