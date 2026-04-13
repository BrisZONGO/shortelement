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
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer un cours par ID
const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) {
      return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    }
    res.json({ success: true, cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer un cours
const createCours = async (req, res) => {
  try {
    const { titre, description, duree, niveau, prix } = req.body;
    
    // Validation des champs requis
    if (!titre || !description || !duree) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre, description et duree sont requis'
      });
    }
    
    const nouveauCours = new Cours({
      titre,
      description,
      duree,
      niveau: niveau || 'débutant',
      prix: prix || 0,
      createdBy: req.userId
    });
    
    const coursSaved = await nouveauCours.save();
    res.status(201).json({ 
      success: true, 
      message: 'Cours créé avec succès', 
      cours: coursSaved 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Un cours avec ce titre existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
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
      return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    }
    
    res.json({ 
      success: true, 
      message: 'Cours mis à jour avec succès', 
      cours 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Un autre cours avec ce titre existe déjà' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un cours
const deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndDelete(req.params.id);
    if (!cours) {
      return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    }
    res.json({ 
      success: true, 
      message: 'Cours supprimé avec succès' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recherche avancée de cours
const searchCours = async (req, res) => {
  try {
    const { q, niveau, prixMin, prixMax, categorie } = req.query;
    
    let query = {};
    
    // Recherche par mot-clé dans titre ou description
    if (q) {
      query.$or = [
        { titre: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Filtre par niveau
    if (niveau) query.niveau = niveau;
    
    // Filtre par catégorie
    if (categorie) query.categorieId = categorie;
    
    // Filtre par prix
    if (prixMin || prixMax) {
      query.prix = {};
      if (prixMin) query.prix.$gte = parseInt(prixMin);
      if (prixMax) query.prix.$lte = parseInt(prixMax);
    }
    
    const cours = await Cours.find(query);
    
    res.json({
      success: true,
      count: cours.length,
      cours,
      searchParams: { q, niveau, prixMin, prixMax, categorie }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Exportation de toutes les fonctions
module.exports = {
  getAllCours,
  getCoursById,
  createCours,
  updateCours,
  deleteCours,
  searchCours
};