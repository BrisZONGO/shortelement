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

// ✅ IMPORT CORRECT DU CRON (depuis cronJobs.js)
//const { startCronJobs } = require('./services/cronService');
const { startCronJobs } = require('./services/cronService');

// =============================
// 🔥 CORS (CORRIGÉ)
// =============================
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://concours-directs-et-professionnels.netlify.app",
    "https://shortelement.onrender.com"
  ],
  credentials: true
}));

app.options("*", cors());

// =============================
// 📦 MIDDLEWARES
// =============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================
// 🌐 ROUTES PUBLIQUES
// =============================
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: "API Concours OK",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      cours: "/api/cours",
      payment: "/api/payment",
      admin: "/api/admin"
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =============================
// 🔐 ROUTES API
// =============================
app.use('/api/auth', authRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// =============================
// ❌ 404 - Route non trouvée
// =============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`
  });
});

// =============================
// ❌ ERROR HANDLER GLOBAL
// =============================
app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur:", err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erreur interne du serveur",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =============================
// 🚀 START SERVER AVEC CRON
// =============================
const PORT = process.env.PORT || 5000;

// Vérification de la configuration requise
const checkRequiredEnv = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Variables d'environnement manquantes: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

// Démarrage du serveur
const startServer = async () => {
  try {
    // Vérifier les variables d'environnement
    if (!checkRequiredEnv()) {
      process.exit(1);
    }

    // Connexion à MongoDB
    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log("✅ MongoDB connecté avec succès");
    console.log(`📊 Base de données: ${mongoose.connection.name}`);

    // Démarrer les tâches cron (planification des rappels)
    console.log("🔄 Initialisation des tâches planifiées...");
    startCronJobs();

    // Démarrer le serveur HTTP
    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur démarré avec succès !`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL API: http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`\n⏰ Tâches cron actives:`);
      console.log(`   - 00:00 → Désactivation abonnements expirés`);
      console.log(`   - 08:00 & 18:00 → Rappels WhatsApp`);
      console.log(`   - 20:00 → Rapport quotidien`);
      console.log(`   - Dimanche 03:00 → Nettoyage données`);
      console.log(`\n✨ Serveur prêt à recevoir des requêtes\n`);
    });

  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error.message);
    
    // Tentative de reconnexion en cas d'erreur MongoDB
    if (error.name === 'MongoServerSelectionError') {
      console.error("⚠️ Impossible de se connecter à MongoDB. Vérifiez votre connexion internet et l'URI.");
    }
    
    process.exit(1);
  }
};

// Gestion des signaux d'arrêt
process.on('SIGINT', async () => {
  console.log('\n🔴 Arrêt du serveur...');
  await mongoose.disconnect();
  console.log('✅ MongoDB déconnecté');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔴 Arrêt du serveur...');
  await mongoose.disconnect();
  console.log('✅ MongoDB déconnecté');
  process.exit(0);
});

// Démarrer le serveur
startServer();