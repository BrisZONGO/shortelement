const Cours = require('../models/Cours');

// =============================
// 📚 ROUTES PUBLIQUES
// =============================

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
    console.error("❌ Erreur getAllCours:", error);
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
    console.error("❌ Erreur getCoursById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 💎 COURS PREMIUM (avec abonnement)
// =============================

// Récupérer tous les cours premium (nécessite abonnement)
const getCoursPremium = async (req, res) => {
  try {
    const coursPremium = await Cours.find({ 
      estPremium: true,
      actif: true 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: coursPremium.length,
      cours: coursPremium,
      abonnement: req.abonnement // Infos d'abonnement du middleware
    });
  } catch (error) {
    console.error("❌ Erreur getCoursPremium:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cours premium"
    });
  }
};

// Récupérer tous les cours gratuits
const getCoursGratuits = async (req, res) => {
  try {
    const coursGratuits = await Cours.find({ 
      estPremium: false,
      actif: true 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: coursGratuits.length,
      cours: coursGratuits
    });
  } catch (error) {
    console.error("❌ Erreur getCoursGratuits:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des cours gratuits"
    });
  }
};

// =============================
// 👑 ROUTES ADMIN
// =============================

// Créer un cours
const createCours = async (req, res) => {
  try {
    const { titre, description, duree, niveau, prix, estPremium, image, categorie } = req.body;
    
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
      estPremium: estPremium || false,
      image: image || '',
      categorie: categorie || 'général',
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
    console.error("❌ Erreur createCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour un cours
const updateCours = async (req, res) => {
  try {
    const { titre, description, duree, niveau, prix, estPremium, image, actif, categorie } = req.body;
    
    const cours = await Cours.findByIdAndUpdate(
      req.params.id,
      { 
        titre, 
        description, 
        duree, 
        niveau, 
        prix,
        estPremium,
        image,
        actif,
        categorie,
        updatedAt: Date.now()
      },
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

// =============================
// 🔍 RECHERCHE AVANCÉE
// =============================

// Recherche avancée de cours
const searchCours = async (req, res) => {
  try {
    const { q, niveau, prixMin, prixMax, categorie, estPremium } = req.query;
    
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
    if (categorie) query.categorie = categorie;
    
    // Filtre par type (premium/gratuit)
    if (estPremium !== undefined) {
      query.estPremium = estPremium === 'true';
    }
    
    // Filtre par prix
    if (prixMin || prixMax) {
      query.prix = {};
      if (prixMin) query.prix.$gte = parseInt(prixMin);
      if (prixMax) query.prix.$lte = parseInt(prixMax);
    }
    
    // Filtre par actif (par défaut uniquement actifs)
    query.actif = true;
    
    const cours = await Cours.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: cours.length,
      cours,
      searchParams: { q, niveau, prixMin, prixMax, categorie, estPremium }
    });
  } catch (error) {
    console.error("❌ Erreur searchCours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 📊 STATISTIQUES (pour admin)
// =============================

// Statistiques des cours
const getCoursStats = async (req, res) => {
  try {
    const totalCours = await Cours.countDocuments();
    const totalPremium = await Cours.countDocuments({ estPremium: true });
    const totalGratuits = await Cours.countDocuments({ estPremium: false });
    const totalActifs = await Cours.countDocuments({ actif: true });
    
    // Par niveau
    const parNiveau = await Cours.aggregate([
      { $group: { _id: '$niveau', count: { $sum: 1 } } }
    ]);
    
    // Par catégorie
    const parCategorie = await Cours.aggregate([
      { $group: { _id: '$categorie', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalCours,
        premium: totalPremium,
        gratuits: totalGratuits,
        actifs: totalActifs,
        parNiveau,
        parCategorie
      }
    });
  } catch (error) {
    console.error("❌ Erreur getCoursStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 📤 EXPORTATION
// =============================
module.exports = {
  getAllCours,
  getCoursById,
  getCoursPremium,
  getCoursGratuits,
  createCours,
  updateCours,
  deleteCours,
  searchCours,
  getCoursStats
};