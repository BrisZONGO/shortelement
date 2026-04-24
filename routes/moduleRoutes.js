const express = require('express');
const router = express.Router();

const { verifierToken, verifierAdmin } = require('../middleware/auth');

const {
  createModule,
  getModulesByCours,
  getModuleWithParties,
  updateModule,
  deleteModule
} = require('../controllers/moduleController');

// =============================
// 🧪 ROUTE TEST (ANTI-404)
// =============================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: "Modules routes OK ✅"
  });
});

// =============================
// 📦 GET MODULES PAR COURS
// =============================
router.get('/cours/:coursId', async (req, res, next) => {
  try {
    const { coursId } = req.params;

    console.log(`📚 Chargement modules pour cours: ${coursId}`);

    if (!coursId) {
      return res.status(400).json({
        success: false,
        message: "coursId requis"
      });
    }

    req.params.coursId = coursId;
    return getModulesByCours(req, res, next);

  } catch (error) {
    console.error("❌ Erreur getModulesByCours:", error.message);
    next(error);
  }
});

// =============================
// 📦 GET MODULE + PARTIES
// =============================
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`📄 Chargement module: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id module requis"
      });
    }

    req.params.id = id;
    return getModuleWithParties(req, res, next);

  } catch (error) {
    console.error("❌ Erreur getModule:", error.message);
    next(error);
  }
});

// =============================
// ➕ CREATE MODULE (ADMIN)
// =============================
router.post('/', verifierToken, verifierAdmin, async (req, res, next) => {
  try {
    console.log("➕ Création module:", req.body);

    if (!req.body.coursId || !req.body.titre) {
      return res.status(400).json({
        success: false,
        message: "coursId et titre requis"
      });
    }

    return createModule(req, res, next);

  } catch (error) {
    console.error("❌ Erreur createModule:", error.message);
    next(error);
  }
});

// =============================
// ✏️ UPDATE MODULE (ADMIN)
// =============================
router.put('/:id', verifierToken, verifierAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`✏️ Update module: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id requis"
      });
    }

    return updateModule(req, res, next);

  } catch (error) {
    console.error("❌ Erreur updateModule:", error.message);
    next(error);
  }
});

// =============================
// 🗑️ DELETE MODULE (ADMIN)
// =============================
router.delete('/:id', verifierToken, verifierAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Suppression module: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id requis"
      });
    }

    return deleteModule(req, res, next);

  } catch (error) {
    console.error("❌ Erreur deleteModule:", error.message);
    next(error);
  }
});

module.exports = router;