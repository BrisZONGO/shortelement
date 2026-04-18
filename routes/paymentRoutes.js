const express = require("express");
const { initPayment, notifyPayment } = require("../controllers/paymentController");

const router = express.Router();

router.post("/init", initPayment);
router.post("/notify", notifyPayment);

module.exports = router;