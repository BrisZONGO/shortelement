const express = require("express");

const {
  createModule,
  getModulesByCours,
  getModuleWithParties,
  updateModule,
  deleteModule
} = require("../controllers/moduleController");

const { protect, isAdmin, optionalAuth } = require("../middleware/auth");
const checkCourseAccess = require("../middleware/checkCourseAccess");

const router = express.Router();

// =============================
// 📦 ROUTES LECTURE
// =============================

router.get("/cours/:coursId", optionalAuth, checkCourseAccess, getModulesByCours);

router.get("/:id", optionalAuth, checkCourseAccess, getModuleWithParties);

// =============================
// 👑 ADMIN
// =============================
router.post("/", protect, isAdmin, createModule);

router.put("/:id", protect, isAdmin, updateModule);

router.delete("/:id", protect, isAdmin, deleteModule);

module.exports = router;
