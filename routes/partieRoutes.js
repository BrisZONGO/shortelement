const express = require('express');
const router = express.Router();

const { verifierToken, verifierAdmin } = require('../middleware/auth');

const {
  createPartie,
  getPartiesByModule,
  getPartieById,
  updatePartie,
  deletePartie,
  reorderParties
} = require('../controllers/partieController');

// =============================
// 🧪 ROUTE TEST (ANTI-404)
// =============================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: "Parties routes OK ✅"
  });
});

// =============================
// 📦 GET PARTIES PAR MODULE
// =============================
router.get('/module/:moduleId', async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    console.log(`📚 Chargement parties pour module: ${moduleId}`);

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "moduleId requis"
      });
    }

    req.params.moduleId = moduleId;
    return getPartiesByModule(req, res, next);

  } catch (error) {
    console.error("❌ Erreur getPartiesByModule:", error.message);
    next(error);
  }
});

// =============================
// 📄 GET PARTIE BY ID
// =============================
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`📄 Chargement partie: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id requis"
      });
    }

    req.params.id = id;
    return getPartieById(req, res, next);

  } catch (error) {
    console.error("❌ Erreur getPartieById:", error.message);
    next(error);
  }
});

// =============================
// ➕ CREATE PARTIE (ADMIN)
// =============================
router.post('/', verifierToken, verifierAdmin, async (req, res, next) => {
  try {
    console.log("➕ Création partie:", req.body);

    if (!req.body.moduleId || !req.body.titre) {
      return res.status(400).json({
        success: false,
        message: "moduleId et titre requis"
      });
    }

    return createPartie(req, res, next);

  } catch (error) {
    console.error("❌ Erreur createPartie:", error.message);
    next(error);
  }
});

// =============================
// ✏️ UPDATE PARTIE (ADMIN)
// =============================
router.put('/:id', verifierToken, verifierAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`✏️ Update partie: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id requis"
      });
    }

    return updatePartie(req, res, next);

  } catch (error) {
    console.error("❌ Erreur updatePartie:", error.message);
    next(error);
  }
});

// =============================
// 🗑️ DELETE PARTIE (ADMIN)
// =============================
router.delete('/:id', verifierToken, verifierAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Suppression partie: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id requis"
      });
    }

    return deletePartie(req, res, next);

  } catch (error) {
    console.error("❌ Erreur deletePartie:", error.message);
    next(error);
  }
});

// =============================
// 🔄 REORDER PARTIES (ADMIN)
// =============================
router.put('/reorder/:moduleId', verifierToken, verifierAdmin, async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    console.log(`🔄 Réorganisation parties module: ${moduleId}`);

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "moduleId requis"
      });
    }

    if (!Array.isArray(req.body.ordre)) {
      return res.status(400).json({
        success: false,
        message: "ordre (array) requis"
      });
    }

    return reorderParties(req, res, next);

  } catch (error) {
    console.error("❌ Erreur reorderParties:", error.message);
    next(error);
  }
});

module.exports = router;