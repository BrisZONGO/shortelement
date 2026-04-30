const express = require("express");

const {
  createPartie,
  getPartiesByModule,
  getPartieById,
  updatePartie,
  deletePartie,
  reorderParties,
  submitTraitementPartie,
  getTentativesPartieForUser,
  getCorrectionPartie
} = require("../controllers/partieController");

const { protect, isAdmin, optionalAuth } = require("../middleware/auth");
const checkCourseAccess = require("../middleware/checkCourseAccess");

const router = express.Router();

// lecture
router.get("/module/:moduleId", optionalAuth, checkCourseAccess, getPartiesByModule);
router.get("/:id", optionalAuth, checkCourseAccess, getPartieById);

// utilisateur connecté
router.post("/:id/traitement", protect, checkCourseAccess, submitTraitementPartie);
router.get("/:id/tentatives", protect, checkCourseAccess, getTentativesPartieForUser);
router.get("/:id/correction", protect, checkCourseAccess, getCorrectionPartie);

// admin
router.post("/", protect, isAdmin, createPartie);
router.put("/:id", protect, isAdmin, updatePartie);
router.delete("/:id", protect, isAdmin, deletePartie);
router.put("/reorder", protect, isAdmin, reorderParties);

module.exports = router;
