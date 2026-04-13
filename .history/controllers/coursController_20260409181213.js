// controllers/coursController.js
const Cours = require('../models/Cours');

// Récupérer tous les cours
const getAllCours = async (req, res) => {
  try {
    const cours = await Cours.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: cours.length,
      cours
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des cours',
      error: error.message 
    });
  }
};

// Récupérer un cours par son ID
const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cours non trouvé' 
      });
    }
    res.json({
      success: true,
      cours
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du cours',
      error: error.message 
    });
  }
};

// Créer un nouveau cours
const createCours = async (req, res) => {
  try {
    const { titre, description, duree, niveau, prix } = req.body;
    
    const nouveauCours = new Cours({
      titre,
      description,
      duree,
      niveau,
      prix,
      createdBy: req.userId
    });
    
    const coursSaved = await nouveauCours.save();
    res.status(201).json({
      success: true,
      message: 'Cours créé avec succès',
      cours: coursSaved
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création du cours',
      error: error.message 
    });
  }
};

// Mettre à jour un cours
const updateCours = async (req, res) => {
  try {
    const { titre, description, duree, niveau, prix } = req.body;
    
    const cours = await Cours.findByIdAndUpdate(
      req.params.id,
      { titre, description, duree, niveau, prix },
      { new: true, runValidators: true }
    );
    
    if (!cours) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cours non trouvé' 
      });
    }
    
    res.json({
      success: true,
      message: 'Cours mis à jour avec succès',
      cours
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour du cours',
      error: error.message 
    });
  }
};

// Supprimer un cours
const deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndDelete(req.params.id);
    
    if (!cours) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cours non trouvé' 
      });
    }
    
    res.json({
      success: true,
      message: 'Cours supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression du cours',
      error: error.message 
    });
  }
};

// Exportation de toutes les fonctions
module.exports = {
  getAllCours,
  getCoursById,
  createCours,
  updateCours,
  deleteCours
};