const Module = require('../models/Module');
const Abonnement = require('../models/Abonnement');

// Activer un module après expiration du précédent
const activerModuleProgressif = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.userId;

    // Vérifier l'abonnement actif
    const abonnement = await Abonnement.findOne({
      userId,
      statut: 'actif',
      dateFin: { $gt: new Date() }
    });

    if (!abonnement) {
      return res.status(403).json({
        success: false,
        message: 'Abonnement requis pour accéder aux modules'
      });
    }

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module non trouvé' });
    }

    const dateDebutAbonnement = new Date(abonnement.dateDebut);
    const aujourdhui = new Date();
    const semainesEcoulees = Math.floor((aujourdhui - dateDebutAbonnement) / (7 * 24 * 60 * 60 * 1000));

    // Vérifier si la semaine du module est accessible
    if (module.numeroSemaine > semainesEcoulees + 1) {
      return res.status(403).json({
        success: false,
        message: `Ce module sera accessible dans ${module.numeroSemaine - semainesEcoulees - 1} semaine(s)`,
        semaineActuelle: semainesEcoulees + 1,
        semaineModule: module.numeroSemaine
      });
    }

    // Activer le module
    module.estActif = true;
    module.dateActivation = aujourdhui;
    await module.save();

    res.json({
      success: true,
      message: 'Module activé avec succès',
      module,
      semaineActuelle: semainesEcoulees + 1,
      totalSemaines: abonnement.dureeMois * 4
    });

  } catch (error) {
    console.error('❌ Erreur activerModuleProgressif:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les modules accessibles pour un utilisateur
const getModulesAccessibles = async (req, res) => {
  try {
    const { coursId } = req.params;
    const userId = req.userId;

    // Vérifier l'abonnement
    const abonnement = await Abonnement.findOne({
      userId,
      statut: 'actif',
      dateFin: { $gt: new Date() }
    });

    if (!abonnement) {
      return res.status(403).json({
        success: false,
        message: 'Abonnement requis'
      });
    }

    const dateDebut = new Date(abonnement.dateDebut);
    const aujourdhui = new Date();
    const semainesEcoulees = Math.floor((aujourdhui - dateDebut) / (7 * 24 * 60 * 60 * 1000));
    const semaineActuelle = semainesEcoulees + 1;
    const totalSemaines = abonnement.dureeMois * 4;

    // Récupérer tous les modules du cours
    const tousModules = await Module.find({ coursId }).sort({ numeroSemaine: 1 });

    // Marquer les modules accessibles
    const modulesAccessibles = tousModules.map(module => ({
      ...module.toObject(),
      accessible: module.numeroSemaine <= semaineActuelle,
      estActif: module.numeroSemaine <= semaineActuelle,
      debloqueDans: Math.max(0, module.numeroSemaine - semaineActuelle)
    }));

    res.json({
      success: true,
      abonnement: {
        type: abonnement.type,
        dateDebut: abonnement.dateDebut,
        dateFin: abonnement.dateFin,
        semaineActuelle,
        totalSemaines
      },
      modules: modulesAccessibles,
      progression: Math.round((semaineActuelle / totalSemaines) * 100)
    });

  } catch (error) {
    console.error('❌ Erreur getModulesAccessibles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  activerModuleProgressif,
  getModulesAccessibles
};