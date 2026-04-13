const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARES ==========
app.use(cors());
app.use(express.json()); // Remplace body-parser (intégré dans Express)
app.use(express.urlencoded({ extended: true }));

// ========== CONNEXION À MONGODB ==========
// Utilisez MongoDB Atlas OU localhost (choisissez une option)

// OPTION 1: MongoDB Atlas (recommandé pour la production)
// Décommentez ceci et commentez l'option 2
/*
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connecté à MongoDB Atlas avec succès'))
    .catch(err => console.error('❌ Erreur de connexion MongoDB Atlas:', err));
*/

// OPTION 2: MongoDB local (pour le développement)
// Commentez ceci si vous utilisez Atlas
mongoose.connect('mongodb://localhost:27017/concours_db')
    .then(() => console.log('✅ Connecté à MongoDB local (concours_db)'))
    .catch(err => console.error('❌ Erreur de connexion MongoDB local:', err));

// ========== ROUTES ==========
// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des cours
app.use('/api/cours', coursRoutes);

// Route de test / accueil
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Backend des concours - Prête à l\'emploi !',
        version: '1.0.0',
        endpoints: {
            auth: {
                inscription: 'POST /api/auth/inscription',
                connexion: 'POST /api/auth/connexion'
            },
            cours: {
                liste: 'GET /api/cours',
                creation: 'POST /api/cours',
                modification: 'PUT /api/cours/:id',
                suppression: 'DELETE /api/cours/:id'
            }
        }
    });
});

// Route 404 - Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route non trouvée',
        requestedUrl: req.originalUrl 
    });
});

// ========== DÉMARRAGE DU SERVEUR ==========
app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré avec succès !`);
    console.log(`📡 Adresse: http://localhost:${PORT}`);
    console.log(`✅ Base de données: MongoDB connectée`);
    console.log(`\n📌 Routes disponibles:`);
    console.log(`   - GET  http://localhost:${PORT}/`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/inscription`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/connexion`);
    console.log(`   - GET  http://localhost:${PORT}/api/cours`);
    console.log(`   - POST http://localhost:${PORT}/api/cours`);
    console.log(`   - PUT  http://localhost:${PORT}/api/cours/:id`);
    console.log(`   - DELETE http://localhost:${PORT}/api/cours/:id`);
    console.log(`\n✨ Serveur prêt à recevoir des requêtes !\n`);
});