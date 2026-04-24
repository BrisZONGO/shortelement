const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// =============================
// 📦 IMPORTS ROUTES
// =============================
const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const partieRoutes = require('./routes/partieRoutes');
const moduleRoutes = require('./routes/moduleRoutes');

// ✅ CRON
const { startCronJobs } = require('./services/cronService');

// =============================
// 🔥 CORS CONFIG (AMÉLIORÉ)
// =============================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://formation-concours.netlify.app',
  'https://concours-directs-et-professionnels.netlify.app',
  'https://shortelement.onrender.com',
  'https://formation-concours.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      console.log(`❌ CORS bloqué: ${origin}`);
      return callback(new Error('CORS policy violation'));
    }

    console.log(`✅ CORS autorisé: ${origin}`);
    callback(null, true);
  },
  credentials: true
}));

// ✅ Gestion explicite OPTIONS (important pour frontend)
app.options('*', cors());

// =============================
// 📦 MIDDLEWARES
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================
// 🌐 ROUTES TEST (ANTI-404)
// =============================

// 👉 TEST MODULES
app.get('/api/modules/test', (req, res) => {
  res.json({ success: true, message: "Modules OK" });
});

// 👉 TEST PARTIES
app.get('/api/parties/test', (req, res) => {
  res.json({ success: true, message: "Parties OK" });
});

// =============================
// 🌐 ROUTES PUBLIQUES
// =============================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "API Concours OK",
    version: "2.0.0",
    endpoints: {
      auth: "/api/auth",
      cours: "/api/cours",
      payment: "/api/payment",
      admin: "/api/admin",
      modules: "/api/modules",
      parties: "/api/parties"
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// =============================
// 🔐 ROUTES API
// =============================
app.use('/api/auth', authRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/parties', partieRoutes);

// =============================
// ❌ 404 HANDLER
// =============================
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`
  });
});

// =============================
// ❌ ERROR HANDLER GLOBAL
// =============================
app.use((err, req, res, next) => {
  console.error("🔥 ERREUR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur serveur"
  });
});

// =============================
// 🚀 START SERVER
// =============================
const PORT = process.env.PORT || 5000;

// Vérification ENV
const checkEnv = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(e => !process.env[e]);

  if (missing.length) {
    console.error(`❌ Variables manquantes: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

const startServer = async () => {
  try {
    if (!checkEnv()) process.exit(1);

    console.log("🔄 Connexion MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB connecté");

    // ✅ CRON
    startCronJobs();

    app.listen(PORT, () => {
      console.log(`
🚀 SERVEUR OK
📡 Port: ${PORT}
🌍 Mode: ${process.env.NODE_ENV || 'dev'}

🔗 http://localhost:${PORT}
💓 /health OK
📦 Modules OK → /api/modules/test
📦 Parties OK → /api/parties/test
      `);
    });

  } catch (err) {
    console.error("❌ Erreur démarrage:", err.message);
    process.exit(1);
  }
};

// =============================
// 🔴 SHUTDOWN PROPRE
// =============================
process.on('SIGINT', async () => {
  console.log('🔴 Fermeture...');
  await mongoose.disconnect();
  process.exit(0);
});

// START
startServer();