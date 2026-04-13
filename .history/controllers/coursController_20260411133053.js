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
    
    const nouveauCours = new Cours({
      titre,
      description,
      duree,
      niveau: niveau || 'débutant',
      prix: prix || 0,
      createdBy: req.userId
    });
    
    const coursSaved = await nouveauCours.save();
    res.status(201).json({ success: true, message: 'Cours créé', cours: coursSaved });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce titre existe déjà' });
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
    
    res.json({ success: true, message: 'Cours mis à jour', cours });
  } catch (error) {
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
    res.json({ success: true, message: 'Cours supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recherche avancée de cours
const searchCours = async (req, res) => {
  try {
    const { q, niveau, prixMin, prixMax, categorie } = req.query;
    
    let query = {};
    
    if (q) {
      query.$or = [
        { titre: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (niveau) query.niveau = niveau;
    if (categorie) query.categorieId = categorie;
    if (prixMin || prixMax) {
      query.prix = {};
      if (prixMin) query.prix.$gte = parseInt(prixMin);
      if (prixMax) query.prix.$lte = parseInt(prixMax);
    }
    
    const cours = await Cours.find(query).populate('categorieId', 'nom couleur');
    
    res.json({
      success: true,
      count: cours.length,
      cours
    });
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
  searchCours
};