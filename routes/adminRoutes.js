const express = require("express");
const router = express.Router();

const {
  verifierToken,
  verifierAdmin,
  protect,
  isAdmin
} = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// =============================
// SAFE WRAPPER (ANTI CRASH)
// =============================
const safe = (fn, name) => {
  if (!fn) {
    console.error(`❌ Fonction manquante: ${name}`);
    return (req, res) =>
      res.status(500).json({
        success: false,
        message: `Fonction ${name} non définie`
      });
  }
  return fn;
};

const authTokenMiddleware = verifierToken || protect;
const adminMiddleware = verifierAdmin || isAdmin;

// =============================
// 👑 ROUTES ADMIN
// =============================

// USERS
router.get(
  "/users",
  authTokenMiddleware,
  adminMiddleware,
  safe(adminController.getUsers, "getUsers")
);

// STATS
router.get(
  "/stats",
  authTokenMiddleware,
  adminMiddleware,
  safe(adminController.getStats, "getStats")
);

// DELETE USER
router.delete(
  "/users/:id",
  authTokenMiddleware,
  adminMiddleware,
  safe(adminController.deleteUser, "deleteUser")
);

module.exports = router;
