const express = require("express");
const router = express.Router();

const { getStats, getAllUsers } = require("../controllers/adminController");
const { verifierToken, verifierAdmin } = require("../middleware/auth");

// 📊 stats
router.get("/stats", verifierToken, verifierAdmin, getStats);

// 👥 users
router.get("/users", verifierToken, verifierAdmin, getAllUsers);

module.exports = router;