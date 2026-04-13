const express = require('express');
const {
  addCommentaire,
  getCommentairesByCours,
  deleteCommentaire,
  likeCommentaire
} = require('../controllers/commentaireController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/cours/:coursId', getCommentairesByCours);

// Routes protégées
router.post('/cours/:coursId', verifierToken, addCommentaire);
router.post('/:id/like', verifierToken, likeCommentaire);
router.delete('/:id', verifierToken, deleteCommentaire);

module.exports = router;