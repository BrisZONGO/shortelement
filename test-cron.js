const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Importer les fonctions
const { verifierAbonnementsExpires } = require('./services/cronJobs');

// Connexion à MongoDB
const testCron = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connecté');
    console.log('📊 Base de données:', mongoose.connection.name);
    
    // Exécuter la fonction de vérification
    console.log('\n🔄 Exécution de verifierAbonnementsExpires...\n');
    await verifierAbonnementsExpires();
    
    console.log('\n✅ Test terminé');
    
    // Déconnexion
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

// Lancer le test
testCron();
