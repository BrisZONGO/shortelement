const express = require("express");

const {
  createModule,
  getModulesByCours,
  getModuleWithParties,
  updateModule,
  deleteModule
} = require("../controllers/moduleController");

const { protect, isAdmin } = require("../middleware/auth");

const router = express.Router();

// =============================
// 📦 ROUTES PUBLIQUES
// =============================

// Modules d'un cours
router.get("/cours/:coursId", getModulesByCours);

// Module + parties
router.get("/:id", getModuleWithParties);


// =============================
// 👑 ADMIN
// =============================
router.post("/", protect, isAdmin, createModule);

router.put("/:id", protect, isAdmin, updateModule);

router.delete("/:id", protect, isAdmin, deleteModule);

module.exports = router;