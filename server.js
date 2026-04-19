const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const paymentRoutes = require("./routes/paymentRoutes");
const { startCronJobs } = require("./services/cronService");
// Ajoutez après les autres imports
const adminController = require('./controllers/adminController');
// Chargement des variables d'environnement AVANT tout
dotenv.config();
// Dans server.js
const adminController = require('./controllers/adminController');

// Routes admin
app.get('/api/admin/stats', verifierToken, verifierAdmin, adminController.getStats);
app.get('/api/admin/users', verifierToken, verifierAdmin, adminController.getAllUsers);
app.put('/api/admin/users/:userId/role', verifierToken, verifierAdmin, adminController.updateUserRole);
const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');

const { verifierToken, verifierAdmin } = require('./middleware/auth');

const app = express();
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// =============================
// 🔥 CORS CORRIGÉ (IMPORTANT)
// =============================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://concours-directs-et-professionnels.netlify.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ CORS bloqué pour :", origin);
      callback(new Error("Non autorisé par CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// ✅ CORS AVANT TOUT
app.use(cors(corsOptions));

// ✅ Gestion PREFLIGHT
app.options("*", cors(corsOptions));

// =============================
// 📦 MIDDLEWARES
// =============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes paiement
app.use("/api/payment", paymentRoutes);

// =============================
// 🚫 RATE LIMIT SIMPLE
// =============================
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 100;

const rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const client = rateLimit.get(ip);

  if (now > client.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (client.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      message: 'Trop de requêtes'
    });
  }

  client.count++;
  next();
};

app.use('/api', rateLimiter);

// =============================
// 🌐 ROUTES PUBLIQUES
// =============================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "API Concours en ligne"
  });
});

// Route de santé pour monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// =============================
// 🔐 ROUTES API
// =============================
app.use('/api/auth', authRoutes);
app.use('/api/cours', coursRoutes);

// =============================
// 🔒 ROUTES PROTÉGÉES
// =============================
app.get('/api/protected', verifierToken, (req, res) => {
  res.json({
    success: true,
    message: "Accès autorisé",
    user: req.userEmail
  });
});

app.get('/api/admin/dashboard', verifierToken, verifierAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Dashboard admin"
  });
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
// ❌ GESTION ERREURS
// =============================
app.use((err, req, res, next) => {
  console.error("❌ ERREUR :", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Erreur serveur"
  });
});

// =============================
// 🚀 CONNEXION DB + START
// =============================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log("✅ MongoDB connecté");

  // ✅ Démarrer les tâches cron (vérifications quotidiennes, rappels, etc.)
  startCronJobs();
  console.log("✅ Tâches planifiées (cron) démarrées");

  // ✅ Écouter sur 0.0.0.0 pour accepter les connexions externes
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    console.log(`📡 Local: http://localhost:${PORT}`);
    console.log(`📡 Réseau: http://0.0.0.0:${PORT}`);
  });

})
.catch(err => {
  console.error("❌ Erreur MongoDB :", err.message);
  process.exit(1);
});