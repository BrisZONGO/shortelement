const express = require("express");
const { getStats } = require("../controllers/adminController");
const { verifierToken, verifierAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", verifierToken, verifierAdmin, getStats);

module.exports = router;