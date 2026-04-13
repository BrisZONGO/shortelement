const Commentaire = require('../models/Commentaire');
const Cours = require('../models/Cours');

// Ajouter un commentaire
const addCommentaire = async (req, res) => {
  try {
    const { contenu, note } = req.body;
    const { coursId } = req.params;

    // Vérifier si le cours existe
    const cours = await Cours.findById(coursId);
    if (!cours) {
      return res.status(404).json({ success: false, message: 'Cours non trouvé' });
    }

    const commentaire = new Commentaire({
      contenu,
      note: note || null,
      coursId,
      userId: req.userId,
      userName: req.userEmail || 'Utilisateur'
    });

    await commentaire.save();

    res.status(201).json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      commentaire
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les commentaires d'un cours
const getCommentairesByCours = async (req, res) => {
  try {
    const { coursId } = req.params;
    const commentaires = await Commentaire.find({ coursId })
      .sort({ createdAt: -1 })
      .populate('userId', 'nom email');

    res.json({
      success: true,
      count: commentaires.length,
      commentaires
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un commentaire (propriétaire ou admin)
const deleteCommentaire = async (req, res) => {
  try {
    const { id } = req.params;
    const commentaire = await Commentaire.findById(id);

    if (!commentaire) {
      return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });
    }

    // Vérifier si l'utilisateur est le propriétaire ou admin
    if (commentaire.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await commentaire.deleteOne();
    res.json({ success: true, message: 'Commentaire supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ajouter un like
const likeCommentaire = async (req, res) => {
  try {
    const { id } = req.params;
    const commentaire = await Commentaire.findById(id);

    if (!commentaire) {
      return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });
    }

    const userLiked = commentaire.likes.includes(req.userId);

    if (userLiked) {
      commentaire.likes = commentaire.likes.filter(uid => uid.toString() !== req.userId);
      await commentaire.save();
      return res.json({ success: true, message: 'Like retiré', likes: commentaire.likes.length });
    } else {
      commentaire.likes.push(req.userId);
      await commentaire.save();
      return res.json({ success: true, message: 'Like ajouté', likes: commentaire.likes.length });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addCommentaire,
  getCommentairesByCours,
  deleteCommentaire,
  likeCommentaire
};