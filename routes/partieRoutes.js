const express = require("express");

const {
  createPartie,
  getPartiesByModule,
  getPartieById,
  updatePartie,
  deletePartie,
  reorderParties
} = require("../controllers/partieController");

const { protect, isAdmin } = require("../middleware/auth");

const router = express.Router();

// =============================
// 📄 PUBLIC
// =============================

router.get("/module/:moduleId", getPartiesByModule);

router.get("/:id", getPartieById);

// =============================
// 👑 ADMIN
// =============================
router.post("/", protect, isAdmin, createPartie);

router.put("/:id", protect, isAdmin, updatePartie);

router.delete("/:id", protect, isAdmin, deletePartie);

router.put("/reorder", protect, isAdmin, reorderParties);

module.exports = router;