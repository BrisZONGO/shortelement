const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// =============================
// 📦 IMPORTS
// =============================
const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { startCronJobs } = require('./services/cronService');

// =============================
// 🔥 CORS (CORRIGÉ)
// =============================
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://concours-directs-et-professionnels.netlify.app"
  ],
  credentials: true
}));

app.options("*", cors());

// =============================
// 📦 MIDDLEWARES
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================
// 🌐 ROUTES PUBLIQUES
// =============================
app.get('/', (req, res) => {
  res.json({ success: true, message: "API Concours OK" });
});

app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1
  });
});

// =============================
// 🔐 ROUTES API
// =============================
app.use('/api/auth', authRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/payment', paymentRoutes);

// ✅ ADMIN (TRÈS IMPORTANT)
app.use('/api/admin', adminRoutes);

// =============================
// ❌ 404
// =============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée"
  });
});

// =============================
// ❌ ERROR HANDLER
// =============================
app.use((err, req, res, next) => {
  console.error("❌", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Erreur serveur"
  });
});

// =============================
// 🚀 START SERVER
// =============================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log("✅ MongoDB connecté");

  startCronJobs();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur ${PORT}`);
  });
})
.catch(err => {
  console.error("❌ MongoDB:", err.message);
});