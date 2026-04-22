const Module = require('../models/Module');
const Partie = require('../models/Partie');

// Créer un module
const createModule = async (req, res) => {
  try {
    const { coursId, titre, description, ordre, dureeEstimee, objectifs } = req.body;
    
    const module = new Module({
      coursId,
      titre,
      description,
      ordre: ordre || 0,
      dureeEstimee,
      objectifs: objectifs || []
    });
    
    await module.save();
    
    res.status(201).json({
      success: true,
      message: 'Module créé avec succès',
      module
    });
  } catch (error) {
    console.error('❌ Erreur createModule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer tous les modules d'un cours
const getModulesByCours = async (req, res) => {
  try {
    const { coursId } = req.params;
    
    const modules = await Module.find({ coursId, actif: true })
      .sort({ ordre: 1 });
    
    // Récupérer le nombre de parties pour chaque module
    const modulesWithCount = await Promise.all(
      modules.map(async (module) => {
        const partiesCount = await Partie.countDocuments({ moduleId: module._id, actif: true });
        return {
          ...module.toObject(),
          partiesCount
        };
      })
    );
    
    res.json({
      success: true,
      count: modules.length,
      modules: modulesWithCount
    });
  } catch (error) {
    console.error('❌ Erreur getModulesByCours:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer un module avec ses parties
const getModuleWithParties = async (req, res) => {
  try {
    const { id } = req.params;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module non trouvé' });
    }
    
    const parties = await Partie.find({ moduleId: id, actif: true })
      .sort({ ordre: 1 });
    
    res.json({
      success: true,
      module,
      parties,
      partiesCount: parties.length
    });
  } catch (error) {
    console.error('❌ Erreur getModuleWithParties:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour un module
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const module = await Module.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module non trouvé' });
    }
    
    res.json({
      success: true,
      message: 'Module mis à jour',
      module
    });
  } catch (error) {
    console.error('❌ Erreur updateModule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un module
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Supprimer toutes les parties liées
    await Partie.deleteMany({ moduleId: id });
    
    const module = await Module.findByIdAndDelete(id);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module non trouvé' });
    }
    
    res.json({
      success: true,
      message: 'Module et ses parties supprimés'
    });
  } catch (error) {
    console.error('❌ Erreur deleteModule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createModule,
  getModulesByCours,
  getModuleWithParties,
  updateModule,
  deleteModule
};