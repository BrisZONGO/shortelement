const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const coursRoutes = require('./routes/coursRoutes');
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello');
});
const app = express();
const PORT = 5000;
app.get('/', (req, res) => res.send('OK'));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connexion MongoDB
mongoose.connect('mongodb://localhost:27017/concours_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connecté à MongoDB'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cours', coursRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Backend des concours - Prête à l\'emploi !' });
});
app.listen(3000, () => {
  console.log('Serveur en écoute sur http://localhost:3000');
});
// Démarrer le serveur
// ✅ Ajoutez ceci
server.listen(3000, () => {
  console.log('Serveur démarré');
});
// Exemple : boucle infinie avec setTimeout
setInterval(() => {
  console.log('En vie...');
}, 1000);
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📌 Routes disponibles:`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/inscription`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/connexion`);
  console.log(`   - GET  http://localhost:${PORT}/api/cours`);
});