const Cours = require('../models/Cours');

// Obtenir tous les cours
const getCours = async (req, res) => {
  try {
    const cours = await Cours.find();
    res.json(cours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un cours par ID
const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });
    res.json(cours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer un cours (admin seulement)
const createCours = async (req, res) => {
  try {
    const cours = new Cours(req.body);
    await cours.save();
    res.status(201).json(cours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getCours, getCoursById, createCours };