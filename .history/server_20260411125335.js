const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();
const upload = require('./middleware/upload');
app.post('/api/upload', verifierToken, upload.single('image'), (req, res) => {
  res.json({
    success: true,
    message: 'Fichier uploadé',
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Importer les routes
const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');

// Importer les middlewares d'authentification
const { verifierToken, verifierAdmin } = require('./middleware/auth');

const app = express();

// ========== CONFIGURATION AVANCÉE ==========
// Configuration CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 heures
};

// Limiteur de requêtes basique (optionnel)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requêtes par fenêtre

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
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
      message: 'Trop de requêtes, veuillez réessayer plus tard'
    });
  }
  
  client.count++;
  next();
};

// ========== MIDDLEWARES GLOBAUX ==========
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Appliquer le rate limiting sur toutes les routes API
app.use('/api', rateLimiter);

// Logger avancé pour le développement
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️' : '✅';
      console.log(`${statusColor} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// ========== CONNEXION À MONGODB ==========
const MONGODB_URI = process.env.MONGODB_URI;

// Vérifier si l'URI est définie
if (!MONGODB_URI) {
  console.error('❌ Erreur: MONGODB_URI non définie dans le fichier .env');
  console.error('💡 Ajoutez MONGODB_URI=mongodb+srv://... dans votre fichier .env');
  process.exit(1);
}

// Variable pour stocker le serveur (CORRECTION: initialisée à null)
let server = null;

// ========== ROUTES PUBLIQUES ==========
// Route d'accueil
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    name: 'API Backend des Concours',
    version: '1.0.0',
    description: 'API complète pour la gestion de concours',
    documentation: '/api/docs',
    endpoints: {
      auth: {
        inscription: 'POST /api/auth/inscription',
        connexion: 'POST /api/auth/connexion',
        deconnexion: 'POST /api/auth/deconnexion',
        profil: 'GET /api/auth/profil (🔒)',
        updateProfil: 'PUT /api/auth/profil (🔒)',
        utilisateurs: 'GET /api/auth/utilisateurs (👑)',
        modifierRole: 'PUT /api/auth/utilisateurs/:userId/role (👑)',
        supprimerUser: 'DELETE /api/auth/utilisateurs/:userId (👑)'
      },
      cours: {
        liste: 'GET /api/cours',
        details: 'GET /api/cours/:id',
        creation: 'POST /api/cours (🔒)',
        modification: 'PUT /api/cours/:id (🔒)',
        suppression: 'DELETE /api/cours/:id (🔒)',
        search: 'GET /api/cours/recherche?q=terme'
      }
    },
    status: {
      server: '🟢 En ligne',
      database: mongoose.connection ? (mongoose.connection.readyState === 1 ? '🟢 Connectée' : '🔴 Déconnectée') : '🔴 Non connectée',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    links: {
      health: '/health',
      docs: '/api/docs',
      metrics: '/metrics'
    }
  });
});

// Route de santé pour monitoring
app.get('/health', (req, res) => {
  const dbState = mongoose.connection ? mongoose.connection.readyState : 0;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbState];
  
  const isHealthy = dbState === 1;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      name: mongoose.connection ? mongoose.connection.name || 'N/A' : 'N/A',
      host: mongoose.connection ? mongoose.connection.host || 'N/A' : 'N/A',
      port: mongoose.connection ? mongoose.connection.port || 'N/A' : 'N/A'
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Métriques basiques
app.get('/metrics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: {
      active: process._getActiveRequests ? process._getActiveRequests().length : 'N/A'
    },
    database: {
      connected: mongoose.connection ? mongoose.connection.readyState === 1 : false,
      collections: mongoose.connection && mongoose.connection.collections ? Object.keys(mongoose.connection.collections).length : 0
    }
  });
});

// Documentation API
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'API Concours - Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${process.env.PORT || 5000}`,
    authentication: {
      type: 'JWT (JSON Web Token)',
      header: 'Authorization: Bearer <votre_token_jwt>',
      howToGet: 'Utilisez POST /api/auth/inscription ou POST /api/auth/connexion'
    },
    endpoints: [
      {
        category: 'Authentification',
        routes: [
          { method: 'POST', path: '/api/auth/inscription', description: 'Créer un compte', auth: false, body: { nom: 'string', email: 'string', password: 'string', role: 'string (optionnel)' } },
          { method: 'POST', path: '/api/auth/connexion', description: 'Se connecter', auth: false, body: { email: 'string', password: 'string' } },
          { method: 'POST', path: '/api/auth/deconnexion', description: 'Se déconnecter', auth: false },
          { method: 'GET', path: '/api/auth/profil', description: 'Voir son profil', auth: true },
          { method: 'PUT', path: '/api/auth/profil', description: 'Mettre à jour son profil', auth: true },
          { method: 'GET', path: '/api/auth/utilisateurs', description: 'Liste des utilisateurs', auth: 'admin' },
          { method: 'PUT', path: '/api/auth/utilisateurs/:userId/role', description: 'Changer rôle', auth: 'admin' },
          { method: 'DELETE', path: '/api/auth/utilisateurs/:userId', description: 'Supprimer utilisateur', auth: 'admin' }
        ]
      },
      {
        category: 'Cours',
        routes: [
          { method: 'GET', path: '/api/cours', description: 'Liste des cours', auth: false },
          { method: 'GET', path: '/api/cours/:id', description: 'Détails d\'un cours', auth: false },
          { method: 'GET', path: '/api/cours/recherche?q=terme', description: 'Rechercher des cours', auth: false },
          { method: 'POST', path: '/api/cours', description: 'Créer un cours', auth: true },
          { method: 'PUT', path: '/api/cours/:id', description: 'Modifier un cours', auth: true },
          { method: 'DELETE', path: '/api/cours/:id', description: 'Supprimer un cours', auth: true }
        ]
      }
    ],
    codesErreur: {
      200: 'Succès',
      201: 'Créé avec succès',
      400: 'Requête invalide',
      401: 'Non authentifié',
      403: 'Accès interdit',
      404: 'Ressource non trouvée',
      429: 'Trop de requêtes',
      500: 'Erreur serveur'
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
    timestamp: new Date().toISOString(),
    message: `Bienvenue ${req.userEmail || 'utilisateur'} !`
  });
});

// Route admin de test
app.get('/api/admin/dashboard', verifierToken, verifierAdmin, (req, res) => {
  res.json({
    success: true,
    message: '👑 Dashboard administrateur',
    admin: {
      id: req.userId,
      email: req.userEmail,
      role: req.userRole
    },
    stats: {
      totalUsers: 'En attente d\'implémentation',
      totalCourses: 'En attente d\'implémentation',
      activeUsers: 'En attente d\'implémentation'
    },
    recentActivity: [
      'Connexions récentes',
      'Inscriptions',
      'Création de cours'
    ],
    quickActions: [
      '➕ Ajouter un utilisateur',
      '📚 Ajouter un cours',
      '📊 Voir les statistiques'
    ]
  });
});
// Routes admin
const adminController = require('./controllers/adminController');
app.get('/api/admin/stats', verifierToken, verifierAdmin, adminController.getStats);
app.put('/api/admin/users/:userId/toggle', verifierToken, verifierAdmin, adminController.toggleUserStatus);
// ========== GESTION DES ERREURS ==========
// Importer les nouvelles routes
const commentaireRoutes = require('./routes/commentaireRoutes');
const categorieRoutes = require('./routes/categorieRoutes'); // À créer

// Utiliser les nouvelles routes
app.use('/api/commentaires', commentaireRoutes);
app.use('/api/categories', categorieRoutes);
// Route 404 - Route non trouvée
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route non trouvée',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: '/api/docs',
    suggestion: 'Consultez /api/docs pour la liste des endpoints disponibles'
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  // Log détaillé de l'erreur
  console.error('❌ Erreur globale:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Erreur de validation MongoDB
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: errors
    });
  }
  
  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      success: false,
      message: `La valeur '${value}' pour le champ '${field}' existe déjà`,
      field: field
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
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token JWT invalide'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token JWT expiré'
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

// ========== DÉMARRAGE DU SERVEUR AVEC GESTION D'ERREUR DE PORT ==========
const startServer = (port) => {
  // Convertir en nombre (important !)
  const portNumber = parseInt(port, 10);
  
  // Vérifier que le port est valide
  if (isNaN(portNumber) || portNumber < 0 || portNumber > 65535) {
    console.error(`❌ Port invalide: ${port}`);
    process.exit(1);
  }
  
  const serverInstance = app.listen(portNumber, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`🚀 API BACKEND CONCOURS - DÉMARRÉE`);
    console.log(`🚀 ========================================`);
    console.log(`📡 URL: http://localhost:${portNumber}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Base de données: ${mongoose.connection && mongoose.connection.readyState === 1 ? 'Connectée ✅' : 'En attente... ⏳'}`);
    console.log(`📦 Base: ${(mongoose.connection && mongoose.connection.name) || 'concours_db'}`);
    console.log(`🔗 Hôte: ${(mongoose.connection && mongoose.connection.host) || 'N/A'}`);
    console.log(`🔒 Rate limiting: ${RATE_LIMIT_MAX} requêtes / ${RATE_LIMIT_WINDOW / 60000} minutes`);
    console.log(`\n📌 DOCUMENTATION:`);
    console.log(`   📖 API Docs: http://localhost:${portNumber}/api/docs`);
    console.log(`   💚 Health: http://localhost:${portNumber}/health`);
    console.log(`   📊 Metrics: http://localhost:${portNumber}/metrics`);
    console.log(`\n🔐 ROUTES PRINCIPALES:`);
    console.log(`   🔓 Publiques:`);
    console.log(`      POST /api/auth/inscription`);
    console.log(`      POST /api/auth/connexion`);
    console.log(`      GET  /api/cours`);
    console.log(`   🔒 Protégées:`);
    console.log(`      GET  /api/auth/profil`);
    console.log(`      POST /api/cours`);
    console.log(`   👑 Admin:`);
    console.log(`      GET  /api/admin/dashboard`);
    console.log(`      GET  /api/auth/utilisateurs`);
    console.log(`\n💡 Test rapide:`);
    console.log(`   curl http://localhost:${portNumber}/health`);
    console.log(`========================================\n`);
  });

  serverInstance.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // IMPORTANT: Addition mathématique, pas concaténation !
      const nextPort = portNumber + 1;
      if (nextPort > 65535) {
        console.error(`❌ Plus aucun port disponible (limite 65535 atteinte)`);
        process.exit(1);
      }
      console.log(`❌ Le port ${portNumber} est déjà utilisé. Tentative avec le port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('❌ Erreur serveur:', err);
      process.exit(1);
    }
  });

  return serverInstance;
};

// ========== INITIALISATION DE L'APPLICATION ==========
const initApp = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connecté à MongoDB avec succès');
    console.log(`📦 Base de données: ${mongoose.connection.name}`);
    console.log(`🔗 Hôte: ${mongoose.connection.host}`);
    
    // Démarrer le serveur APRÈS la connexion MongoDB (CORRECTION: stocker l'instance)
    const initialPort = parseInt(process.env.PORT || 5000, 10);
    server = startServer(initialPort);
    
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    console.error('💡 Vérifiez que:');
    console.error('   1. Votre URI dans .env est correcte');
    console.error('   2. Votre mot de passe ne contient pas de caractères spéciaux non encodés');
    console.error('   3. Votre adresse IP est autorisée dans MongoDB Atlas (Network Access)');
    process.exit(1);
  }
};

// Lancer l'application
initApp();

// Gestion des événements MongoDB
mongoose.connection.on('error', err => {
  console.error('❌ Erreur MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB déconnecté. Tentative de reconnexion...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnecté avec succès');
});

// ========== GESTION DE L'ARRÊT GRACIEUX ==========
const gracefulShutdown = () => {
  console.log('\n⚠️ Signal d\'arrêt reçu. Fermeture gracieuse en cours...');
  
  if (server) {
    server.close(async () => {
      console.log('📡 Serveur HTTP fermé');
      
      try {
        await mongoose.connection.close();
        console.log('✅ Connexion MongoDB fermée');
        console.log('👋 Arrêt complet - À bientôt !');
        process.exit(0);
      } catch (err) {
        console.error('❌ Erreur lors de la fermeture de MongoDB:', err);
        process.exit(1);
      }
    });
  } else {
    console.log('⚠️ Aucun serveur à fermer');
    process.exit(0);
  }
  
  // Forcer la fermeture après 10 secondes
  const timeout = setTimeout(() => {
    console.error('⚠️ Délai de fermeture dépassé (10s), arrêt forcé');
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

// Nettoyage périodique du rate limiting
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimit.entries()) {
    if (now > data.resetTime) {
      rateLimit.delete(ip);
    }
  }
}, 60000);

module.exports = app;