const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');

// Importer les middlewares d'authentification
const { verifierToken, verifierAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARES GLOBAUX ==========
// Configuration CORS améliorée
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger pour le développement
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0 && !req.url.includes('/inscription') && !req.url.includes('/connexion')) {
      console.log('📦 Body:', { ...req.body, password: req.body.password ? '***' : undefined });
    }
    next();
  });
}

// ========== CONNEXION À MONGODB ==========
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/concours_db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connecté à MongoDB avec succès');
  console.log(`📦 Base de données: ${mongoose.connection.name}`);
  console.log(`🔗 URI: ${MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://***:***@/')}`);
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB:', err.message);
  console.error('💡 Vérifiez que MongoDB est démarré (mongod) ou que l\'URI Atlas est correcte');
  process.exit(1);
});

// Gestion des événements MongoDB
mongoose.connection.on('error', err => {
  console.error('❌ Erreur MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB déconnecté. Tentative de reconnexion...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnecté');
});

// ========== ROUTES PUBLIQUES ==========
// Route d'accueil
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'API Backend des concours - Prête à l\'emploi !',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: {
        inscription: 'POST /api/auth/inscription',
        connexion: 'POST /api/auth/connexion',
        deconnexion: 'POST /api/auth/deconnexion',
        profil: 'GET /api/auth/profil (🔒 protégé)',
        updateProfil: 'PUT /api/auth/profil (🔒 protégé)',
        utilisateurs: 'GET /api/auth/utilisateurs (👑 admin)',
        modifierRole: 'PUT /api/auth/utilisateurs/:userId/role (👑 admin)',
        supprimerUser: 'DELETE /api/auth/utilisateurs/:userId (👑 admin)'
      },
      cours: {
        liste: 'GET /api/cours',
        details: 'GET /api/cours/:id',
        creation: 'POST /api/cours (🔒 protégé)',
        modification: 'PUT /api/cours/:id (🔒 protégé)',
        suppression: 'DELETE /api/cours/:id (🔒 protégé)'
      }
    },
    status: {
      server: '🟢 En ligne',
      database: mongoose.connection.readyState === 1 ? '🟢 Connectée' : '🔴 Déconnectée',
      timestamp: new Date().toISOString()
    }
  });
});

// Route de santé pour monitoring
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbState];
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'N/A'
    },
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de documentation simple
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'API Concours',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}`,
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>'
    },
    endpoints: {
      auth: {
        inscription: {
          method: 'POST',
          url: '/api/auth/inscription',
          body: {
            nom: 'string (requis)',
            email: 'string (requis)',
            password: 'string (requis)',
            role: 'string (optionnel, défaut: "user")'
          }
        },
        connexion: {
          method: 'POST',
          url: '/api/auth/connexion',
          body: {
            email: 'string (requis)',
            password: 'string (requis)'
          }
        },
        profil: {
          method: 'GET',
          url: '/api/auth/profil',
          headers: { Authorization: 'Bearer <token>' }
        }
      }
    }
  });
});

// ========== ROUTES API ==========
// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des cours
app.use('/api/cours', coursRoutes);

// Route protégée de test
app.get('/api/protected', verifierToken, (req, res) => {
  res.json({
    success: true,
    message: '✅ Accès autorisé à la route protégée',
    user: {
      id: req.userId,
      role: req.userRole,
      email: req.userEmail
    },
    timestamp: new Date().toISOString()
  });
});

// Route admin de test
app.get('/api/admin/dashboard', verifierToken, verifierAdmin, (req, res) => {
  res.json({
    success: true,
    message: '👑 Bienvenue sur le dashboard administrateur',
    admin: {
      id: req.userId,
      email: req.userEmail,
      role: req.userRole
    },
    stats: {
      totalUsers: 'À implémenter',
      totalCourses: 'À implémenter',
      activeSessions: 'À implémenter'
    },
    actions: [
      'Gérer les utilisateurs',
      'Gérer les cours',
      'Voir les statistiques',
      'Configurer l\'application'
    ]
  });
});

// ========== GESTION DES ERREURS ==========

// Route 404 - Route non trouvée
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route non trouvée',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      { method: 'GET', url: '/' },
      { method: 'GET', url: '/health' },
      { method: 'GET', url: '/api/docs' },
      { method: 'GET', url: '/api/protected', auth: 'required' },
      { method: 'GET', url: '/api/admin/dashboard', auth: 'admin' },
      { method: 'POST', url: '/api/auth/inscription' },
      { method: 'POST', url: '/api/auth/connexion' },
      { method: 'GET', url: '/api/auth/profil', auth: 'required' },
      { method: 'PUT', url: '/api/auth/profil', auth: 'required' },
      { method: 'GET', url: '/api/cours' },
      { method: 'GET', url: '/api/cours/:id' }
    ]
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('❌ Erreur globale:', err.stack);
  
  // Erreur de validation MongoDB
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors
    });
  }
  
  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `La valeur '${err.keyValue[field]}' pour le champ '${field}' existe déjà`
    });
  }
  
  // Erreur de casting MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `ID invalide: ${err.value}`,
      field: err.path
    });
  }
  
  const status = err.status || 500;
  const message = err.message || 'Erreur interne du serveur';
  
  res.status(status).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.toString()
    })
  });
});

// ========== DÉMARRAGE DU SERVEUR ==========
const server = app.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS !`);
  console.log(`🚀 ========================================`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Base de données: ${mongoose.connection.readyState === 1 ? 'Connectée ✅' : 'En attente... ⏳'}`);
  console.log(`📦 Base: ${mongoose.connection.name || 'concours_db'}`);
  console.log(`\n📌 ROUTES DISPONIBLES:`);
  console.log(`   🏠 Accueil:`);
  console.log(`      - GET  http://localhost:${PORT}/`);
  console.log(`      - GET  http://localhost:${PORT}/health`);
  console.log(`      - GET  http://localhost:${PORT}/api/docs`);
  console.log(`   🔐 Authentification:`);
  console.log(`      - POST http://localhost:${PORT}/api/auth/inscription`);
  console.log(`      - POST http://localhost:${PORT}/api/auth/connexion`);
  console.log(`      - POST http://localhost:${PORT}/api/auth/deconnexion`);
  console.log(`      - GET  http://localhost:${PORT}/api/auth/profil (🔒)`);
  console.log(`      - PUT  http://localhost:${PORT}/api/auth/profil (🔒)`);
  console.log(`      - GET  http://localhost:${PORT}/api/auth/utilisateurs (👑)`);
  console.log(`   📚 Cours:`);
  console.log(`      - GET  http://localhost:${PORT}/api/cours`);
  console.log(`      - GET  http://localhost:${PORT}/api/cours/:id`);
  console.log(`      - POST http://localhost:${PORT}/api/cours (🔒)`);
  console.log(`      - PUT  http://localhost:${PORT}/api/cours/:id (🔒)`);
  console.log(`      - DELETE http://localhost:${PORT}/api/cours/:id (🔒)`);
  console.log(`   🧪 Tests:`);
  console.log(`      - GET  http://localhost:${PORT}/api/protected (🔒)`);
  console.log(`      - GET  http://localhost:${PORT}/api/admin/dashboard (👑)`);
  console.log(`\n🔒 Légende: 🔒 = Authentification requise | 👑 = Admin requis`);
  console.log(`========================================\n`);
});

// ========== GESTION DE L'ARRÊT GRACIEUX ==========
const gracefulShutdown = () => {
  console.log('\n⚠️ Signal d\'arrêt reçu. Fermeture gracieuse...');
  
  server.close(async () => {
    console.log('📡 Serveur HTTP fermé');
    
    try {
      await mongoose.connection.close();
      console.log('✅ Connexion MongoDB fermée');
      console.log('👋 Arrêt complet');
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur lors de la fermeture de MongoDB:', err);
      process.exit(1);
    }
  });
  
  // Forcer la fermeture après 10 secondes
  const timeout = setTimeout(() => {
    console.error('⚠️ Délai dépassé, fermeture forcée');
    process.exit(1);
  }, 10000);
  
  timeout.unref();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('❌ Exception non capturée:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
});

module.exports = app; // Pour les tests