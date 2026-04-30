const express = require("express");

const {
  createPartie,
  getPartiesByModule,
  getPartieById,
  updatePartie,
  deletePartie,
  reorderParties
} = require("../controllers/partieController");

const { protect, isAdmin, optionalAuth } = require("../middleware/auth");
const checkCourseAccess = require("../middleware/checkCourseAccess");

const router = express.Router();

// =============================
// 📄 LECTURE
// =============================
router.get("/module/:moduleId", optionalAuth, checkCourseAccess, getPartiesByModule);

router.get("/:id", optionalAuth, checkCourseAccess, getPartieById);

// =============================
// 👑 ADMIN
// =============================
router.post("/", protect, isAdmin, createPartie);

router.put("/:id", protect, isAdmin, updatePartie);

router.delete("/:id", protect, isAdmin, deletePartie);

router.put("/reorder", protect, isAdmin, reorderParties);

module.exports = router;

