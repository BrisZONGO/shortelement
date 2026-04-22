const Abonnement = require('../models/Abonnement');
const User = require('../models/User');

const TYPES_ABONNEMENT = {
  '6_mois': { duree: 6, prix: 25000 },
  '9_mois': { duree: 9, prix: 35000 },
  '12_mois': { duree: 12, prix: 45000 }
};

// Créer un abonnement
const createAbonnement = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.userId;

    if (!TYPES_ABONNEMENT[type]) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'abonnement invalide. Choisir: 6_mois, 9_mois, 12_mois'
      });
    }

    const { duree, prix } = TYPES_ABONNEMENT[type];
    const dateDebut = new Date();
    const dateFin = new Date();
    dateFin.setMonth(dateFin.getMonth() + duree);

    // Désactiver les anciens abonnements
    await Abonnement.updateMany(
      { userId, statut: 'actif' },
      { statut: 'expire' }
    );

    const abonnement = new Abonnement({
      userId,
      type,
      dureeMois: duree,
      prix,
      dateDebut,
      dateFin,
      montantPaye: prix,
      statut: 'actif'
    });

    await abonnement.save();

    // Mettre à jour l'utilisateur
    await User.findByIdAndUpdate(userId, {
      'abonnement.actif': true,
      'abonnement.type': type,
      'abonnement.dateDebut': dateDebut,
      'abonnement.dateFin': dateFin
    });

    res.status(201).json({
      success: true,
      message: `Abonnement ${type} créé avec succès`,
      abonnement
    });

  } catch (error) {
    console.error('❌ Erreur createAbonnement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer l'abonnement actif
const getAbonnementActif = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();

    const abonnement = await Abonnement.findOne({
      userId,
      statut: 'actif',
      dateFin: { $gt: now }
    });

    if (!abonnement) {
      return res.json({
        success: true,
        actif: false,
        message: 'Aucun abonnement actif'
      });
    }

    const joursRestants = Math.ceil((abonnement.dateFin - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      actif: true,
      abonnement,
      joursRestants,
      type: abonnement.type,
      dateFin: abonnement.dateFin
    });

  } catch (error) {
    console.error('❌ Erreur getAbonnementActif:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lister tous les abonnements d'un utilisateur
const getMesAbonnements = async (req, res) => {
  try {
    const userId = req.userId;

    const abonnements = await Abonnement.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: abonnements.length,
      abonnements
    });

  } catch (error) {
    console.error('❌ Erreur getMesAbonnements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtenir les types d'abonnement disponibles
const getTypesAbonnement = async (req, res) => {
  res.json({
    success: true,
    types: [
      { id: '6_mois', label: '6 mois', duree: 6, prix: 25000 },
      { id: '9_mois', label: '9 mois', duree: 9, prix: 35000 },
      { id: '12_mois', label: '12 mois', duree: 12, prix: 45000 }
    ]
  });
};

module.exports = {
  createAbonnement,
  getAbonnementActif,
  getMesAbonnements,
  getTypesAbonnement
};