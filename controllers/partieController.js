const Partie = require('../models/Partie');
const Module = require('../models/Module');

// Créer une partie/sous-module
const createPartie = async (req, res) => {
  try {
    const { moduleId, titre, description, contenu, type, url, duree, ordre, ressources, estGratuit } = req.body;
    
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module non trouvé' });
    }
    
    const partie = new Partie({
      moduleId,
      titre,
      description,
      contenu,
      type: type || 'document',
      url: url || '',
      duree,
      ordre: ordre || 0,
      ressources: ressources || [],
      estGratuit: estGratuit || false
    });
    
    await partie.save();
    
    res.status(201).json({
      success: true,
      message: 'Sous-module créé avec succès',
      partie
    });
  } catch (error) {
    console.error('❌ Erreur createPartie:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer toutes les parties d'un module
const getPartiesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const parties = await Partie.find({ moduleId, actif: true })
      .sort({ ordre: 1 });
    
    res.json({
      success: true,
      count: parties.length,
      parties
    });
  } catch (error) {
    console.error('❌ Erreur getPartiesByModule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer une partie par ID
const getPartieById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const partie = await Partie.findById(id);
    if (!partie) {
      return res.status(404).json({ success: false, message: 'Sous-module non trouvé' });
    }
    
    res.json({ success: true, partie });
  } catch (error) {
    console.error('❌ Erreur getPartieById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour une partie
const updatePartie = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const partie = await Partie.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!partie) {
      return res.status(404).json({ success: false, message: 'Sous-module non trouvé' });
    }
    
    res.json({
      success: true,
      message: 'Sous-module mis à jour',
      partie
    });
  } catch (error) {
    console.error('❌ Erreur updatePartie:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer une partie
const deletePartie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const partie = await Partie.findByIdAndDelete(id);
    if (!partie) {
      return res.status(404).json({ success: false, message: 'Sous-module non trouvé' });
    }
    
    res.json({ success: true, message: 'Sous-module supprimé' });
  } catch (error) {
    console.error('❌ Erreur deletePartie:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Réordonner les parties
const reorderParties = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { partieIds } = req.body;
    
    for (let i = 0; i < partieIds.length; i++) {
      await Partie.findByIdAndUpdate(partieIds[i], { ordre: i });
    }
    
    res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('❌ Erreur reorderParties:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPartie,
  getPartiesByModule,
  getPartieById,
  updatePartie,
  deletePartie,
  reorderParties
};