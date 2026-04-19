const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// ✅ INIT APP AVANT TOUT
const app = express();

// =============================
// 📦 IMPORTS
// =============================
const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const { startCronJobs } = require("./services/cronService");
const { verifierToken, verifierAdmin } = require('./middleware/auth');

// =============================
// 🔥 CORS
// =============================
const allowedOrigins = [
  "http://localhost:3000",
  "https://concours-directs-et-professionnels.netlify.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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
// 🚫 RATE LIMIT
// =============================
const rateLimit = new Map();

app.use('/api', (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, time: now });
    return next();
  }

  const data = rateLimit.get(ip);

  if (now - data.time > 15 * 60 * 1000) {
    rateLimit.set(ip, { count: 1, time: now });
    return next();
  }

  if (data.count > 100) {
    return res.status(429).json({ message: "Trop de requêtes" });
  }

  data.count++;
  next();
});

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

// ✅ 👉 TRÈS IMPORTANT (TA DEMANDE)
app.use("/api/admin", adminRoutes);

// =============================
// 🔒 ROUTES PROTÉGÉES TEST
// =============================
app.get('/api/protected', verifierToken, (req, res) => {
  res.json({ success: true });
});

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
  console.error(err.message);
  res.status(500).json({ success: false, message: err.message });
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
    console.log(`🚀 Serveur sur port ${PORT}`);
  });
})
.catch(err => {
  console.error(err);
});