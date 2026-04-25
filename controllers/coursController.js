const Cours = require('../models/Cours');

// Récupérer tous les cours avec pagination
const getAllCours = async (req, res) => {
  try {
    // Pagination - paramètres avec valeurs par défaut
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filtres optionnels
    const filters = {};
    if (req.query.estPremium !== undefined) {
      filters.estPremium = req.query.estPremium === 'true';
    }
    if (req.query.actif !== undefined) {
      filters.actif = req.query.actif === 'true';
    }
    if (req.query.niveau) {
      filters.niveau = req.query.niveau;
    }
    
    // Exécuter les requêtes en parallèle
    const [cours, total] = await Promise.all([
      Cours.find(filters)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-__v'), // Exclure __v pour réduire la taille
      Cours.countDocuments(filters)
    ]);
    
    res.json({
      success: true,
      cours,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Erreur getAllCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer un cours par ID avec sélection des champs
const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id)
      .select('-__v');
    
    if (!cours) {
      return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    }
    
    res.json({ success: true, cours });
  } catch (error) {
    console.error("❌ Erreur getCoursById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer un cours avec validation des champs
const createCours = async (req, res) => {
  try {
    // Validation des champs requis
    const { titre, description } = req.body;
    if (!titre || !description) {
      return res.status(400).json({
        success: false,
        message: 'Les champs titre et description sont requis'
      });
    }
    
    const cours = new Cours(req.body);
    await cours.save();
    
    // Retourner le cours sans __v
    const savedCours = cours.toObject();
    delete savedCours.__v;
    
    res.status(201).json({
      success: true,
      message: 'Cours créé avec succès',
      cours: savedCours
    });
  } catch (error) {
    console.error("❌ Erreur createCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour un cours
const updateCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!cours) {
      return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    }
    
    res.json({
      success: true,
      message: 'Cours mis à jour avec succès',
      cours
    });
  } catch (error) {
    console.error("❌ Erreur updateCours:", error);
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
    console.error("❌ Erreur deleteCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recherche avancée de cours avec pagination
const searchCours = async (req, res) => {
  try {
    const { q, niveau, prixMin, prixMax, estPremium } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Recherche par mot-clé
    if (q) {
      query.$or = [
        { titre: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Filtres
    if (niveau) query.niveau = niveau;
    if (estPremium !== undefined) query.estPremium = estPremium === 'true';
    
    // Filtre par prix
    if (prixMin || prixMax) {
      query.prix = {};
      if (prixMin) query.prix.$gte = parseInt(prixMin);
      if (prixMax) query.prix.$lte = parseInt(prixMax);
    }
    
    // Exécuter la recherche
    const [cours, total] = await Promise.all([
      Cours.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-__v'),
      Cours.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      count: cours.length,
      cours,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      searchParams: { q, niveau, prixMin, prixMax, estPremium }
    });
  } catch (error) {
    console.error("❌ Erreur searchCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cours premium avec pagination
const getCoursPremium = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const [cours, total] = await Promise.all([
      Cours.find({ estPremium: true, actif: true })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-__v'),
      Cours.countDocuments({ estPremium: true, actif: true })
    ]);
    
    res.json({
      success: true,
      count: cours.length,
      cours,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Erreur getCoursPremium:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cours gratuits avec pagination
const getCoursGratuits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const [cours, total] = await Promise.all([
      Cours.find({ estPremium: false, actif: true })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-__v'),
      Cours.countDocuments({ estPremium: false, actif: true })
    ]);
    
    res.json({
      success: true,
      count: cours.length,
      cours,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("❌ Erreur getCoursGratuits:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Statistiques des cours (pour admin)
const getCoursStats = async (req, res) => {
  try {
    const [total, premium, gratuits, actifs] = await Promise.all([
      Cours.countDocuments(),
      Cours.countDocuments({ estPremium: true }),
      Cours.countDocuments({ estPremium: false }),
      Cours.countDocuments({ actif: true })
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        premium,
        gratuits,
        actifs
      }
    });
  } catch (error) {
    console.error("❌ Erreur getCoursStats:", error);
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
  getCoursGratuits,
  getCoursStats
};