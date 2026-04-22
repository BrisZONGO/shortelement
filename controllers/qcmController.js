const QCM = require('../models/QCM');
const TentativeQCM = require('../models/TentativeQCM');

// Créer un QCM avec parties
const createQCM = async (req, res) => {
  try {
    const { moduleId, semaineIndex, partieIndex, titre, description, parties, seuilReussite } = req.body;

    const qcm = new QCM({
      moduleId,
      semaineIndex,
      partieIndex,
      titre,
      description,
      parties,
      seuilReussite: seuilReussite || 80
    });

    await qcm.save();

    res.status(201).json({
      success: true,
      message: 'QCM créé avec succès',
      qcm
    });

  } catch (error) {
    console.error('❌ Erreur createQCM:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ajouter une question à une partie
const addQuestion = async (req, res) => {
  try {
    const { qcmId, partieIndex } = req.params;
    const { texte, propositions, reponseCorrecte, commentaire, points } = req.body;

    const qcm = await QCM.findById(qcmId);
    if (!qcm) {
      return res.status(404).json({ success: false, message: 'QCM non trouvé' });
    }

    if (partieIndex >= qcm.parties.length) {
      return res.status(400).json({ success: false, message: 'Partie invalide' });
    }

    const nouvelleQuestion = {
      texte,
      propositions,
      reponseCorrecte,
      commentaire: commentaire || '',
      points: points || 1
    };

    qcm.parties[partieIndex].questions.push(nouvelleQuestion);
    await qcm.save();

    res.json({
      success: true,
      message: 'Question ajoutée avec succès',
      qcm
    });

  } catch (error) {
    console.error('❌ Erreur addQuestion:', error);
    res.status(500).json
